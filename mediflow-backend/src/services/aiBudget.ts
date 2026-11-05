import mongoose from "mongoose";
import { AiUsage } from "../models/AiUsage";

export type AiFeature = "triage" | "prescription_extraction";
export type BudgetDecision = "allowed" | "budget_exceeded" | "budget_unavailable";

const DAY_MS = 24 * 60 * 60 * 1000;
const QUOTA_RETENTION_DAYS = 2; // quota keys can name a user, so they don't linger
const METRIC_RETENTION_DAYS = 35;

function envInt(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value >= 0 && process.env[name] !== "" && process.env[name] !== undefined
        ? value
        : fallback;
}

/** Tokens per day across all AI features: the closest thing here to a spending limit. */
function dailyTokenLimit(): number {
    return envInt("AI_DAILY_TOKEN_LIMIT", 500000);
}

/** Read on each call so limits can change through the environment and in tests. */
export function aiLimits(feature: AiFeature): { global: number; perUser: number; demo: number } {
    return feature === "triage"
        ? {
            global: envInt("AI_TRIAGE_DAILY_LIMIT", 2000),
            perUser: envInt("AI_TRIAGE_USER_DAILY_LIMIT", 40),
            demo: envInt("AI_TRIAGE_DEMO_DAILY_LIMIT", 300),
        }
        : {
            global: envInt("AI_EXTRACTION_DAILY_LIMIT", 100),
            perUser: envInt("AI_EXTRACTION_USER_DAILY_LIMIT", 5),
            demo: 0,
        };
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically takes one unit unless the limit is reached. At the limit the
 * filter matches nothing, so the upsert tries to insert a second document with
 * the same unique key and fails with 11000. A first-ever request can hit the
 * same error by racing another insert, so it gets one retry.
 */
async function take(key: string, feature: string, limit: number): Promise<boolean> {
    if (limit <= 0) return false;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            await AiUsage.findOneAndUpdate(
                { key, count: { $lt: limit } },
                {
                    $inc: { count: 1 },
                    $setOnInsert: {
                        kind: "quota",
                        day: today(),
                        feature,
                        expiresAt: new Date(Date.now() + QUOTA_RETENTION_DAYS * DAY_MS),
                    },
                },
                { upsert: true }
            );
            return true;
        } catch (err: any) {
            if (err?.code !== 11000) throw err;
        }
    }
    return false;
}

/**
 * Call before spending money on a model request. `userId` of null means the
 * public demo, which shares one bucket. Fails closed: if the count can't be
 * checked, the caller uses its non-AI path rather than spending blind.
 */
export async function reserveAiCall(feature: AiFeature, userId: string | null): Promise<BudgetDecision> {
    if (mongoose.connection.readyState !== 1) return "budget_unavailable";
    const limits = aiLimits(feature);
    const day = today();
    try {
        // Call counts alone can't bound cost, because one call can be far bigger than another.
        const [used] = await AiUsage.aggregate([
            { $match: { kind: "metric", day } },
            { $group: { _id: null, tokens: { $sum: "$tokens" } } },
        ]);
        if ((used?.tokens ?? 0) >= dailyTokenLimit()) return "budget_exceeded";

        const actorOk = userId
            ? await take(`quota:${day}:${feature}:user:${userId}`, feature, limits.perUser)
            : await take(`quota:${day}:${feature}:demo`, feature, limits.demo);
        if (!actorOk) return "budget_exceeded";
        const globalOk = await take(`quota:${day}:${feature}:global`, feature, limits.global);
        return globalOk ? "allowed" : "budget_exceeded";
    } catch {
        return "budget_unavailable";
    }
}

/** Per-patient upload limits. These counters survive deleting an upload, so deleting can't reset them. */
export function uploadLimits(): { perDay: number; rejectedPerDay: number } {
    return {
        perDay: envInt("UPLOAD_USER_DAILY_LIMIT", 10),
        rejectedPerDay: envInt("UPLOAD_USER_DAILY_REJECTED_LIMIT", 3),
    };
}

/**
 * Called before an upload's body is read, so a blocked account costs no bandwidth.
 * Every attempt counts, including ones rejected later.
 */
export async function reserveUpload(userId: string): Promise<BudgetDecision | "too_many_rejected"> {
    if (mongoose.connection.readyState !== 1) return "budget_unavailable";
    const day = today();
    const limits = uploadLimits();
    try {
        const rejected = await AiUsage.findOne({ key: `quota:${day}:upload_rejected:user:${userId}` }).select("count").lean();
        if ((rejected?.count ?? 0) >= limits.rejectedPerDay) return "too_many_rejected";
        const ok = await take(`quota:${day}:upload:user:${userId}`, "upload", limits.perDay);
        return ok ? "allowed" : "budget_exceeded";
    } catch {
        return "budget_unavailable";
    }
}

/** Counts a document rejected as not a prescription. Never throws: it can't get in the way of the response. */
export async function recordRejectedUpload(userId: string): Promise<void> {
    if (mongoose.connection.readyState !== 1) return;
    await take(`quota:${today()}:upload_rejected:user:${userId}`, "upload_rejected", Number.MAX_SAFE_INTEGER).catch(() => false);
}

/** Counts one outcome. Never throws and is never awaited on a request path: metrics can't break care. */
export function recordAiOutcome(feature: AiFeature, outcome: string, tokens = 0): void {
    if (mongoose.connection.readyState !== 1) return;
    const day = today();
    AiUsage.updateOne(
        { key: `metric:${day}:${feature}:${outcome}` },
        {
            $inc: { count: 1, tokens },
            $setOnInsert: {
                kind: "metric",
                day,
                feature,
                outcome,
                expiresAt: new Date(Date.now() + METRIC_RETENTION_DAYS * DAY_MS),
            },
        },
        { upsert: true }
    ).catch(() => { });
}

/** Totals for the admin endpoint. Aggregates only; contains no per-user rows. */
export async function getUsageSummary(days: number) {
    const since = new Date(Date.now() - (days - 1) * DAY_MS).toISOString().slice(0, 10);
    const rows = await AiUsage.find({ kind: "metric", day: { $gte: since } })
        .select("day feature outcome count tokens -_id")
        .sort({ day: -1, feature: 1, outcome: 1 })
        .lean();
    return {
        days,
        rows,
        limits: {
            dailyTokens: dailyTokenLimit(),
            triage: aiLimits("triage"),
            prescription_extraction: aiLimits("prescription_extraction"),
        },
    };
}
