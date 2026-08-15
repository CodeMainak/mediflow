import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { DoctorProfile } from "../models/DoctorProfile";
import { User } from "../models/User";

// Real-world specialization naming is inconsistent (e.g. doctors listed as
// "General Medicine" rather than "General Physician"), so a few common
// synonyms are matched alongside the canonical name.
const SPECIALIZATION_ALIASES: Record<string, string[]> = {
    "General Physician": ["General Medicine", "Family Medicine", "General Practice"],
};

function specializationRegex(specialization: string): RegExp {
    const terms = [specialization, ...(SPECIALIZATION_ALIASES[specialization] || [])];
    return new RegExp(terms.join("|"), "i");
}

type Urgency = "low" | "medium" | "high" | "emergency";

interface Triage {
    specialization: string;
    urgency: Urgency;
    reasoning: string;
}

const SPECIALIZATIONS = [
    "General Physician",
    "Cardiology",
    "Dermatology",
    "Orthopedics",
    "Pediatrics",
    "ENT",
    "Neurology",
    "Psychiatry",
    "Gynecology",
    "Ophthalmology",
    "Dentistry",
    "Pulmonology",
    "Gastroenterology",
    "Endocrinology",
    "Urology",
];

const DISCLAIMER =
    "This is an automated suggestion based on the symptoms you described, not a medical diagnosis. " +
    "If this could be a medical emergency, call your local emergency number immediately.";

const EMERGENCY_KEYWORDS = [
    "can't breathe", "cannot breathe", "difficulty breathing", "chest pain", "unconscious",
    "severe bleeding", "bleeding heavily", "stroke", "heart attack", "seizure", "not breathing",
    "suicidal", "poisoning", "severe allergic",
];

const RULES: { keywords: string[]; specialization: string; urgency: Urgency }[] = [
    { keywords: ["chest pain", "heart", "palpitation", "blood pressure"], specialization: "Cardiology", urgency: "high" },
    { keywords: ["skin", "rash", "acne", "itch", "mole"], specialization: "Dermatology", urgency: "low" },
    { keywords: ["bone", "fracture", "joint", "back pain", "sprain", "knee", "shoulder"], specialization: "Orthopedics", urgency: "medium" },
    { keywords: ["child", "infant", "baby", "toddler"], specialization: "Pediatrics", urgency: "medium" },
    { keywords: ["ear", "nose", "throat", "sinus", "hearing"], specialization: "ENT", urgency: "low" },
    { keywords: ["headache", "migraine", "dizziness", "numbness", "seizure", "memory"], specialization: "Neurology", urgency: "medium" },
    { keywords: ["anxiety", "depress", "stress", "sleep", "mood", "panic"], specialization: "Psychiatry", urgency: "low" },
    { keywords: ["pregnan", "period", "menstrual", "gynec"], specialization: "Gynecology", urgency: "medium" },
    { keywords: ["eye", "vision", "blurry"], specialization: "Ophthalmology", urgency: "low" },
    { keywords: ["tooth", "teeth", "gum", "dental"], specialization: "Dentistry", urgency: "low" },
    { keywords: ["cough", "breath", "asthma", "wheeze", "lung"], specialization: "Pulmonology", urgency: "medium" },
    { keywords: ["stomach", "abdominal", "nausea", "vomit", "diarrhea", "digestion"], specialization: "Gastroenterology", urgency: "medium" },
    { keywords: ["thyroid", "diabetes", "sugar level", "hormone"], specialization: "Endocrinology", urgency: "medium" },
    { keywords: ["urinary", "kidney", "bladder"], specialization: "Urology", urgency: "medium" },
];

function ruleBasedTriage(symptoms: string): Triage {
    const text = symptoms.toLowerCase();

    if (EMERGENCY_KEYWORDS.some((k) => text.includes(k))) {
        return {
            specialization: "General Physician",
            urgency: "emergency",
            reasoning: "What you described could be serious and shouldn't wait for a routine appointment.",
        };
    }

    for (const rule of RULES) {
        if (rule.keywords.some((k) => text.includes(k))) {
            return {
                specialization: rule.specialization,
                urgency: rule.urgency,
                reasoning: `Based on the symptoms you described, a ${rule.specialization} specialist is a reasonable starting point.`,
            };
        }
    }

    return {
        specialization: "General Physician",
        urgency: "low",
        reasoning: "A General Physician can evaluate these symptoms and refer you further if needed.",
    };
}

async function openAiTriage(symptoms: string): Promise<Triage | null> {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) return null;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0.2,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a triage assistant for a healthcare app. Given a patient's plain-language " +
                            "description of their symptoms, respond with ONLY a JSON object with keys: " +
                            `"specialization" (must be exactly one of: ${SPECIALIZATIONS.join(", ")}), ` +
                            '"urgency" (one of: low, medium, high, emergency), and "reasoning" (one short sentence, ' +
                            "plain language, no diagnosis, no medication advice). " +
                            "Use \"emergency\" only for symptoms that suggest a life-threatening condition.",
                    },
                    { role: "user", content: symptoms },
                ],
            }),
        });

        if (!response.ok) return null;

        const data: any = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) return null;

        const parsed = JSON.parse(content);
        if (!SPECIALIZATIONS.includes(parsed.specialization)) {
            parsed.specialization = "General Physician";
        }
        if (!["low", "medium", "high", "emergency"].includes(parsed.urgency)) {
            parsed.urgency = "medium";
        }
        return {
            specialization: parsed.specialization,
            urgency: parsed.urgency,
            reasoning: String(parsed.reasoning || "").slice(0, 300),
        };
    } catch {
        return null;
    }
}

export const symptomCheck = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const symptoms = String(req.body?.symptoms || "").trim();

        if (!symptoms) {
            res.status(400).json({ msg: "Please describe your symptoms." });
            return;
        }
        if (symptoms.length > 1000) {
            res.status(400).json({ msg: "Please keep your description under 1000 characters." });
            return;
        }

        const triage = (await openAiTriage(symptoms)) || ruleBasedTriage(symptoms);

        // Emergency cases shouldn't be routed into routine appointment booking.
        if (triage.urgency === "emergency") {
            res.json({
                specialization: triage.specialization,
                urgency: triage.urgency,
                reasoning: triage.reasoning,
                disclaimer: DISCLAIMER,
                doctors: [],
            });
            return;
        }

        const regex = specializationRegex(triage.specialization);

        let doctors = await DoctorProfile.find({ specialization: { $regex: regex } })
            .populate("user", "name email")
            .sort({ experience: -1 })
            .limit(3);

        let doctorList = doctors.map((d) => ({
            id: d._id,
            name: (d.user as any)?.name || "Unknown",
            specialization: d.specialization,
            experience: d.experience,
        }));

        // Fall back to Users with a Doctor role when no DoctorProfile records exist yet.
        if (doctorList.length === 0) {
            const fallbackDoctors = await User.find({ role: "Doctor", specialization: { $regex: regex } })
                .select("name specialization")
                .limit(3);
            doctorList = fallbackDoctors.map((d) => ({
                id: d._id,
                name: d.name,
                specialization: d.specialization || triage.specialization,
                experience: 0,
            }));
        }

        res.json({
            specialization: triage.specialization,
            urgency: triage.urgency,
            reasoning: triage.reasoning,
            disclaimer: DISCLAIMER,
            doctors: doctorList,
        });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};
