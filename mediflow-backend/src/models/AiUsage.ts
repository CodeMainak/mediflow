import { Schema, model, Document } from "mongoose";

/**
 * Daily AI quotas and privacy-safe usage metrics. Holds counts only: never
 * prompts, replies or patient text. Documents remove themselves via TTL.
 */
export interface IAiUsage extends Document {
    key: string;
    kind: "quota" | "metric";
    day: string; // YYYY-MM-DD, UTC
    feature: string;
    outcome?: string;
    count: number;
    tokens: number;
    expiresAt: Date;
}

const aiUsageSchema = new Schema<IAiUsage>({
    key: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["quota", "metric"], required: true },
    day: { type: String, required: true },
    feature: { type: String, required: true },
    outcome: { type: String },
    count: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
});

aiUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
aiUsageSchema.index({ kind: 1, day: 1 });

export const AiUsage = model<IAiUsage>("AiUsage", aiUsageSchema);
