// Runs the real model over the synthetic samples in test-fixtures/prescriptions
// and scores it. Unit tests mock OpenAI, so this is the only check of real
// reading quality and of whether the model accepts each file type.
// Usage: npm run eval:prescriptions (needs OPENAI_API_KEY; costs a few cents)
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { extractPrescription } from "../src/services/prescriptionExtraction";

dotenv.config();

const DIR = path.join(__dirname, "../test-fixtures/prescriptions");
const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".pdf": "application/pdf" };

// Allows small misreadings of a blurred word, while still catching a different medicine.
function similar(a: string, b: string): boolean {
    const shared = [...new Set(a)].filter((c) => b.includes(c)).length;
    return a[0] === b[0] && shared / new Set(b).size >= 0.7;
}

interface Expected {
    medications: string[];
    findings: string[];
    mustNotContain: string[];
    mayMissMedications?: boolean; // too blurred to expect a full read; inventing is still a failure
    notPrescription?: boolean;
    allowedFindingWords?: string[]; // every finding must contain one of these
}

async function main() {
    if (!process.env["OPENAI_API_KEY"]) {
        console.error("OPENAI_API_KEY is not set, so nothing was evaluated.");
        process.exit(2);
    }

    const expected: Record<string, Expected> = JSON.parse(fs.readFileSync(path.join(DIR, "expected.json"), "utf8"));
    let failures = 0;

    for (const [file, want] of Object.entries(expected)) {
        const result = await extractPrescription(fs.readFileSync(path.join(DIR, file)), MIME[path.extname(file)]);
        if (!result.ok) {
            failures++;
            console.log(`FAIL ${file}: ${result.reason}${result.status ? ` (HTTP ${result.status})` : ""}`);
            continue;
        }

        const { medications, findings } = result.extraction;
        const names = medications.map((m) => m.name.toLowerCase());
        const notes = findings.map((f) => f.text.toLowerCase()).join(" | ");
        const missed = want.mayMissMedications ? [] : want.medications.filter((m) => !names.some((n) => n.includes(m)));
        const invented = medications
            .filter((m) => !want.medications.some((w) => m.name.toLowerCase().split(/\s+/).some((word) => word.includes(w) || (want.mayMissMedications && similar(word, w)))))
            .map((m) => m.name);
        const dosesKept = medications.filter((m) => /\d\s*(mg|mcg|ml|g)\b/i.test(m.name)).map((m) => m.name);
        const inventedFindings = want.allowedFindingWords
            ? findings.filter((f) => !want.allowedFindingWords!.some((w) => f.text.toLowerCase().includes(w))).map((f) => f.text)
            : [];
        const wrongKind = result.extraction.isPrescription === !!want.notPrescription;
        const missedFindings = want.findings.filter((f) => !notes.includes(f));
        const leaked = want.mustNotContain.filter((t) => JSON.stringify(result.extraction).includes(t));
        const ok = !missed.length && !invented.length && !dosesKept.length && !inventedFindings.length && !wrongKind && !missedFindings.length && !leaked.length;
        if (!ok) failures++;

        console.log(`${ok ? "PASS" : "FAIL"} ${file}: ${result.tokens} tokens, isPrescription ${result.extraction.isPrescription}, legibility ${result.extraction.legibility}, unreadable lines ${result.extraction.unreadableMedicationLines}`);
        console.log(`  read: ${medications.map((m) => `${m.name} [${m.confidence}]`).join(", ") || "none"}`);
        if (findings.length) console.log(`  findings: ${findings.map((f) => `${f.text} [${f.confidence}]`).join(", ")}`);
        if (inventedFindings.length) console.log(`  INVENTED findings: ${inventedFindings.join(", ")}`);
        if (wrongKind) console.log(`  wrong isPrescription: ${result.extraction.isPrescription}`);
        if (dosesKept.length) console.log(`  DOSE KEPT in a name: ${dosesKept.join(", ")}`);
        if (missed.length) console.log(`  missed medicines: ${missed.join(", ")}`);
        if (invented.length) console.log(`  INVENTED medicines: ${invented.join(", ")}`);
        if (missedFindings.length) console.log(`  missed findings: ${missedFindings.join(", ")}`);
        if (leaked.length) console.log(`  LEAKED identifiers: ${leaked.join(", ")}`);
    }

    console.log(failures ? `\n${failures} sample(s) failed.` : "\nAll samples passed.");
    process.exit(failures ? 1 : 0);
}

main();
