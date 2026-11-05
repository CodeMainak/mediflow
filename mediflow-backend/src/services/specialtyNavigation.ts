import { baseMatch, isEmergencyText, mentions } from "../controllers/aiController";

export interface VerifiedDetails {
    medications: { name: string }[];
    findings: string[];
}

export interface SpecialtySuggestion {
    specialization: string;
    strength: "stronger" | "possible";
    reasons: string[];
}

export interface Navigation {
    suggestions: SpecialtySuggestion[];
    uncertainty: string[];
    urgentNotice: string | null;
    disclaimer: string;
}

const DEFAULT_SPECIALTY = "General Physician";

const DISCLAIMER =
    "This is a suggestion about which kind of doctor to talk to, based only on what you confirmed. " +
    "It isn't a diagnosis or medical advice. Don't start, stop or change a medicine because of it.";

const URGENT_NOTICE =
    "Your prescription mentions something that can be serious. If you have it right now, " +
    "call your local emergency number instead of booking an appointment.";

// Deterministic on purpose: the same input always gets the same suggestion, it
// can be tested and reviewed, and text in a document can't steer it. Common
// generic names only. A medicine can have other uses, which is why these are
// never more than "possible" alone. The list needs clinical review before real use.
const MEDICATION_SPECIALTIES: Record<string, string[]> = {
    Endocrinology: ["metformin", "insulin", "levothyroxine", "glimepiride", "sitagliptin"],
    Cardiology: ["atorvastatin", "rosuvastatin", "amlodipine", "metoprolol", "losartan", "lisinopril", "clopidogrel"],
    Pulmonology: ["salbutamol", "albuterol", "budesonide", "montelukast", "tiotropium"],
    Gastroenterology: ["omeprazole", "pantoprazole", "mesalamine"],
    Psychiatry: ["sertraline", "fluoxetine", "escitalopram", "olanzapine"],
    Neurology: ["levetiracetam", "sumatriptan", "donepezil"],
    Dermatology: ["isotretinoin", "tretinoin"],
    Urology: ["tamsulosin"],
    Ophthalmology: ["latanoprost", "timolol"],
};

function specialtyForMedication(name: string): string | null {
    for (const [specialty, medicines] of Object.entries(MEDICATION_SPECIALTIES)) {
        if (medicines.some((medicine) => mentions(name, medicine))) return specialty;
    }
    return null;
}

/** Suggests which kind of doctor to talk to. It never names a condition or recommends a medicine. */
export function suggestSpecialties(details: VerifiedDetails): Navigation {
    const evidence = new Map<string, { findings: string[]; medications: string[] }>();
    const entry = (specialty: string) => {
        if (!evidence.has(specialty)) evidence.set(specialty, { findings: [], medications: [] });
        return evidence.get(specialty)!;
    };

    for (const finding of details.findings) {
        const { specialization } = baseMatch(finding);
        if (specialization !== DEFAULT_SPECIALTY) entry(specialization).findings.push(finding);
    }

    const unrecognised: string[] = [];
    for (const { name } of details.medications) {
        const specialty = specialtyForMedication(name);
        if (specialty) entry(specialty).medications.push(name);
        else unrecognised.push(name);
    }

    const ranked = [...evidence.entries()]
        .map(([specialization, { findings, medications }]) => ({
            specialization,
            score: findings.length * 2 + medications.length,
            hasFinding: findings.length > 0,
            reasons: [
                ...findings.map((f) => `You confirmed this note from your prescription: "${f}".`),
                ...medications.map((m) => `${m} is a medicine often managed by this kind of doctor, though it can have other uses.`),
            ],
        }))
        .sort((a, b) => b.score - a.score || a.specialization.localeCompare(b.specialization))
        .slice(0, 3);

    const uncertainty: string[] = [];
    if (details.medications.length === 0 && details.findings.length === 0) {
        uncertainty.push("We don't have any confirmed details to go on, so this is only a general starting point.");
    } else if (ranked.length === 0) {
        uncertainty.push("Nothing you confirmed clearly points to one kind of doctor, so a general physician is a sensible first step.");
    }
    if (ranked.length > 1) {
        uncertainty.push("Your details point to more than one kind of doctor. A general physician can help you decide if you're unsure.");
    }
    if (unrecognised.length > 0) {
        uncertainty.push(`We couldn't use these to narrow things down: ${unrecognised.join(", ")}. That doesn't mean anything is wrong with them.`);
    }

    const suggestions: SpecialtySuggestion[] = ranked.map((r) => ({
        specialization: r.specialization,
        strength: r.hasFinding || r.score >= 2 ? "stronger" : "possible",
        reasons: r.reasons,
    }));
    if (suggestions.length === 0) {
        suggestions.push({
            specialization: DEFAULT_SPECIALTY,
            strength: "possible",
            reasons: ["A general physician can look at your whole situation and refer you if needed."],
        });
    }

    return {
        suggestions,
        uncertainty,
        urgentNotice: details.findings.some(isEmergencyText) ? URGENT_NOTICE : null,
        disclaimer: DISCLAIMER,
    };
}
