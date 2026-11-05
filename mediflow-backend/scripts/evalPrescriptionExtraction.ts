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

interface Expected {
    medications: string[];
    findings: string[];
    mustNotContain: string[];
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
        const missed = want.medications.filter((m) => !names.some((n) => n.includes(m)));
        const invented = medications.filter((m) => !want.medications.some((w) => m.name.toLowerCase().includes(w))).map((m) => m.name);
        const missedFindings = want.findings.filter((f) => !notes.includes(f));
        const leaked = want.mustNotContain.filter((t) => JSON.stringify(result.extraction).includes(t));
        const ok = !missed.length && !invented.length && !missedFindings.length && !leaked.length;
        if (!ok) failures++;

        console.log(`${ok ? "PASS" : "FAIL"} ${file}: ${result.tokens} tokens, legibility ${result.extraction.legibility}`);
        console.log(`  read: ${medications.map((m) => `${m.name} [${m.confidence}]`).join(", ") || "none"}`);
        if (missed.length) console.log(`  missed medicines: ${missed.join(", ")}`);
        if (invented.length) console.log(`  INVENTED medicines: ${invented.join(", ")}`);
        if (missedFindings.length) console.log(`  missed findings: ${missedFindings.join(", ")}`);
        if (leaked.length) console.log(`  LEAKED identifiers: ${leaked.join(", ")}`);
    }

    console.log(failures ? `\n${failures} sample(s) failed.` : "\nAll samples passed.");
    process.exit(failures ? 1 : 0);
}

main();
