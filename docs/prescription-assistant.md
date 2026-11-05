# Prescription Assistant

A patient uploads a prescription, checks what was read from it, and sees which kind of doctor they could talk to. It gives navigation only: no diagnosis and no medicine advice. **It has not had clinical review, and real patient documents shouldn't be uploaded until the blockers below are cleared.**

Code: `controllers/prescriptionAssistantController.ts`, `services/prescriptionExtraction.ts`, `services/specialtyNavigation.ts` and `components/prescriptions/PrescriptionAssistant.tsx`.

## MVP scope

| In | Out, on purpose |
| --- | --- |
| One JPG, PNG or PDF per upload, up to 5 MB | Multiple files or multi-document uploads |
| Reading medicine names, dose text as written, and stated findings | Interaction checks, dose validation, adherence reminders |
| Patient must check and can correct everything | Treating extracted data as verified or adding it to the medical record |
| Rule-based specialty suggestions with reasons | AI-generated medical advice |
| Linking to clinic doctors, booking and nearby care | Sharing documents with clinic staff |

## Architecture

```mermaid
flowchart TD
    P[Patient's browser] -->|"1. upload with consent<br/>JWT, multipart"| API[Express API: patient-only, owner-scoped]
    API -->|"checks first bytes, 5 MB limit"| F[(PrescriptionFile: bytes<br/>TTL 24 h, no public URL)]
    API --> U[(PrescriptionUpload: details<br/>TTL 30 days)]
    P -->|"2. extract"| API
    API -->|"daily quota"| Q[(AiUsage: counts only)]
    API -->|"3. document, strict schema, store: false"| O[OpenAI]
    O -->|"validated, or manual entry on any failure"| API
    P -->|"4. patient checks and corrects"| API
    API -->|"verified details only"| N[Rule-based specialty map]
    API -.->|"original deleted on confirm"| F
    P -->|"5. search and book"| D[Existing doctor search and booking]
```

The model only *reads*. The specialty suggestion comes from deterministic rules, and only from details the patient confirmed. So nothing written inside a document can choose a specialty without the patient seeing it first.

## API

All routes need a signed-in patient. Staff get 403. Another patient's upload is a 404, so ids can't be probed.

| Route | Purpose |
| --- | --- |
| `POST /api/prescription-assistant/uploads` | Upload with `consent=true`: 201, 400, 413, 415 or 429 |
| `GET /uploads`, `GET /uploads/:id` | The patient's uploads, without file bytes |
| `GET /uploads/:id/file` | The original: `no-store`, `nosniff`, owner only |
| `POST /uploads/:id/extract` | Read the document. Safe to repeat: an atomic claim stops double charges, and a finished read isn't redone |
| `PUT /uploads/:id/verification` | Save confirmed details (needs `confirmed: true`), get suggestions, delete the original |
| `DELETE /uploads/:id` | Delete the record and the file |

## Key decisions

| Decision | Why | Trade-off |
| --- | --- | --- |
| Store files in MongoDB with a TTL index | Private by default, survives Render's temporary disk, deletes itself, adds no new service | Atlas storage is small. Capped at 5 files per patient; move to private S3 with presigned URLs for real volume |
| Check the file's first bytes | The filename and declared type are chosen by the client | Doesn't scan for malicious content inside a valid file |
| Don't store the filename | Filenames often contain a person's name | The list shows dates only |
| Rules for specialties, not the LLM | Testable, repeatable, reviewable and not open to prompt injection | Misses brand names and misspellings, and says so |
| Reject invalid model output, never repair it | A made-up value here would be a made-up medical detail | More cases fall back to manual entry |
| Manual entry on every AI failure | The feature keeps working without AI, or over budget | The patient types more |

## How invention is prevented

1. The prompt forbids guessing, completing or supplying a typical dose.
2. `parseExtraction` never fills anything in. A placeholder such as "unknown" becomes `null`, or is dropped and counted as unreadable.
3. Low-confidence items are flagged "Please check", and unreadable lines are counted for the patient.
4. Nothing is used until the patient confirms, and their version replaces the model's.

## Privacy and consent

Before upload, the patient is told that the document goes to OpenAI, who can open it here, and when it's deleted. Consent is required and stored with its version and time. Staff have no route to these documents. Requests set `store: false`. See [security-review.md](security-review.md) for retention and logging.

## Test status

| Area | Status |
| --- | --- |
| API, access control, retention dates, quotas, failure paths | Automated against a real MongoDB, with OpenAI mocked |
| UI: consent, validation, cancel, retry, corrections, results | Automated in jsdom, then run end to end in real Chrome with OpenAI stubbed |
| **Real reading of printed and handwritten documents** | **Not yet run: no API key was available.** Run `npm run eval:prescriptions` |
| **PDF on `gpt-4o-mini`** | **Unconfirmed.** OpenAI's guide says vision models "such as gpt-4o and later" but doesn't name it. If it fails, the patient gets manual entry; set `PRESCRIPTION_MODEL` to change model |

The samples in `test-fixtures/prescriptions` are synthetic. The "handwritten" one uses a handwriting-style font, which is easier than real handwriting, so also try real-looking samples that contain no real patient data.

## Blockers before real patient use

- [ ] Clinical review of `MEDICATION_SPECIALTIES`, the wording of results and the extraction prompt
- [ ] A data processing agreement with OpenAI, and a legal basis for sending health data to it
- [ ] Legal review of the consent wording and retention periods
- [ ] Evaluation on a realistic, de-identified set of handwritten prescriptions
- [ ] Removing the "this is a demo" line from the consent text only after all of the above
