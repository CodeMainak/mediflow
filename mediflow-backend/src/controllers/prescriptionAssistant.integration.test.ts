import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { createApp } from "../app";
import { PrescriptionFile } from "../models/PrescriptionFile";
import { PrescriptionUpload } from "../models/PrescriptionUpload";
import { AiUsage } from "../models/AiUsage";
import { startDatabase, stopDatabase, clearDatabase, signedInUser } from "../test/harness";
import { detectFileType, MAX_FILE_BYTES } from "./prescriptionAssistantController";

const app = createApp();
const API = "/api/prescription-assistant/uploads";
const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "../../test-fixtures/prescriptions", name));
const PNG = fixture("printed.png");

const reading = {
    isPrescription: true,
    legibility: "clear",
    medications: [{ name: "Salbutamol inhaler", details: "2 puffs when needed", confidence: "high" }],
    findings: [{ text: "wheezing and cough", confidence: "high" }],
    unreadableMedicationLines: 0,
};

describe("prescription assistant API", () => {
    const fetchMock = vi.fn();
    let infoSpy: ReturnType<typeof vi.spyOn>;

    const openAiReturns = (extraction: unknown) => fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(extraction) } }], usage: { total_tokens: 900 } }),
    });
    const upload = (auth: object, file = PNG, name = "jane-doe-prescription.png") =>
        request(app).post(API).set(auth).field("consent", "true").attach("file", file, name);

    beforeAll(startDatabase);
    afterAll(stopDatabase);

    beforeEach(async () => {
        await clearDatabase();
        vi.stubEnv("OPENAI_API_KEY", "test-key");
        vi.stubGlobal("fetch", fetchMock);
        fetchMock.mockReset();
        infoSpy = vi.spyOn(console, "info").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("upload", () => {
        it("should require a signed-in patient", async () => {
            const doctor = await signedInUser("Doctor");

            expect((await request(app).post(API)).status).toBe(401);
            expect((await upload(doctor.auth)).status).toBe(403);
        });

        it.each(["printed.png", "handwritten.jpg", "printed.pdf"])("should accept %s", async (name) => {
            const { auth } = await signedInUser("Patient");

            const res = await upload(auth, fixture(name), name);

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({ status: "uploaded", hasFile: true });
        });

        it("should require consent and record which version was given", async () => {
            const { auth } = await signedInUser("Patient");

            const refused = await request(app).post(API).set(auth).attach("file", PNG, "a.png");
            expect(refused.status).toBe(400);
            expect(await PrescriptionUpload.countDocuments()).toBe(0);

            const res = await upload(auth);
            const stored = await PrescriptionUpload.findById(res.body._id);
            expect(stored?.consentVersion).toBeTruthy();
            expect(stored?.consentedAt).toBeInstanceOf(Date);
        });

        it("should go by the file's content, not its claimed name or type", async () => {
            const { auth } = await signedInUser("Patient");
            const script = Buffer.from("<script>alert(1)</script>");

            const res = await request(app).post(API).set(auth).field("consent", "true")
                .attach("file", script, { filename: "scan.png", contentType: "image/png" });

            expect(res.status).toBe(415);
            expect(await PrescriptionFile.countDocuments()).toBe(0);
        });

        it("should reject a file over the size limit", async () => {
            const { auth } = await signedInUser("Patient");
            const big = Buffer.concat([PNG, Buffer.alloc(MAX_FILE_BYTES)]);

            const res = await upload(auth, big);

            expect(res.status).toBe(413);
            expect(res.body.msg).toContain("5 MB");
        });

        it("should reject a request with no file", async () => {
            const { auth } = await signedInUser("Patient");

            expect((await request(app).post(API).set(auth).field("consent", "true")).status).toBe(400);
        });

        it("should not store the original filename, which can contain a name", async () => {
            const { auth } = await signedInUser("Patient");

            const res = await upload(auth);

            const stored = await PrescriptionUpload.findById(res.body._id).lean();
            expect(JSON.stringify(stored)).not.toContain("jane-doe");
            expect(JSON.stringify(res.body)).not.toContain("jane-doe");
        });

        it("should stop one patient filling the database", async () => {
            const { auth } = await signedInUser("Patient");
            for (let i = 0; i < 5; i++) expect((await upload(auth)).status).toBe(201);

            expect((await upload(auth)).status).toBe(429);
        });

        it("should set retention dates when storing a file", async () => {
            const { auth } = await signedInUser("Patient");
            const res = await upload(auth);

            const file = await PrescriptionFile.findOne({ upload: res.body._id });
            const stored = await PrescriptionUpload.findById(res.body._id);
            const hours = (d: Date) => (d.getTime() - Date.now()) / 3600000;
            expect(hours(file!.expiresAt)).toBeCloseTo(24, 0);
            expect(hours(stored!.expiresAt) / 24).toBeCloseTo(30, 0);
        });

        it("should have TTL indexes that actually expire both collections", async () => {
            for (const model of [PrescriptionFile, PrescriptionUpload, AiUsage]) {
                const indexes = await model.collection.indexes();
                expect(indexes.some((i) => i.key["expiresAt"] === 1 && i.expireAfterSeconds === 0)).toBe(true);
            }
        });
    });

    describe("access control", () => {
        it("should hide one patient's data from another on every route", async () => {
            const owner = await signedInUser("Patient");
            const other = await signedInUser("Patient");
            const { body } = await upload(owner.auth);
            const url = `${API}/${body._id}`;

            expect((await request(app).get(url).set(other.auth)).status).toBe(404);
            expect((await request(app).get(`${url}/file`).set(other.auth)).status).toBe(404);
            expect((await request(app).post(`${url}/extract`).set(other.auth)).status).toBe(404);
            expect((await request(app).put(`${url}/verification`).set(other.auth).send({ confirmed: true, medications: [], findings: [] })).status).toBe(404);
            expect((await request(app).delete(url).set(other.auth)).status).toBe(404);
            expect((await request(app).get(API).set(other.auth)).body).toEqual([]);

            expect(fetchMock).not.toHaveBeenCalled();
            expect(await PrescriptionUpload.countDocuments()).toBe(1);
            expect(await PrescriptionFile.countDocuments()).toBe(1);
        });

        it.each(["Doctor", "Receptionist", "Admin", "Pharmacist"] as const)("should not give a %s any access", async (role) => {
            const owner = await signedInUser("Patient");
            const staff = await signedInUser(role);
            const { body } = await upload(owner.auth);

            expect((await request(app).get(`${API}/${body._id}/file`).set(staff.auth)).status).toBe(403);
        });

        it("should treat a malformed id as not found", async () => {
            const { auth } = await signedInUser("Patient");

            expect((await request(app).get(`${API}/not-an-id`).set(auth)).status).toBe(404);
        });

        it("should serve the file to its owner without allowing caching or sniffing", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);

            const res = await request(app).get(`${API}/${body._id}/file`).set(auth);

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toContain("image/png");
            expect(res.headers["cache-control"]).toBe("private, no-store");
            expect(res.headers["x-content-type-options"]).toBe("nosniff");
            expect(Buffer.compare(res.body, PNG)).toBe(0);
        });

        it("should not expose files through a public path", async () => {
            expect((await request(app).get("/uploads/anything.png")).status).toBe(404);
        });
    });

    describe("extraction", () => {
        it("should store what was read and mark it for checking", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            openAiReturns(reading);

            const res = await request(app).post(`${API}/${body._id}/extract`).set(auth);

            expect(res.body.status).toBe("extracted");
            expect(res.body.extraction.medications[0].name).toBe("Salbutamol inhaler");
        });

        it("should not pay twice for a document already read", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            openAiReturns(reading);

            await request(app).post(`${API}/${body._id}/extract`).set(auth);
            const again = await request(app).post(`${API}/${body._id}/extract`).set(auth);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(again.body.status).toBe("extracted");
        });

        it("should allow only one of two simultaneous extractions", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            openAiReturns(reading);

            const results = await Promise.all([
                request(app).post(`${API}/${body._id}/extract`).set(auth),
                request(app).post(`${API}/${body._id}/extract`).set(auth),
            ]);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(results.map((r) => r.status).sort()).toEqual([200, expect.any(Number)]);
        });

        it.each([
            ["something that isn't a prescription", { ...reading, isPrescription: false }, "not_a_prescription"],
            ["an unreadable document", { ...reading, legibility: "unreadable" }, "unreadable"],
        ])("should offer manual entry for %s", async (_label, extraction, failure) => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            openAiReturns(extraction);

            const res = await request(app).post(`${API}/${body._id}/extract`).set(auth);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ status: "needs_manual", extractionFailure: failure });
            expect(res.body.extraction.medications).toEqual([]);
        });

        it.each([
            ["OpenAI is down", () => fetchMock.mockRejectedValue(new TypeError("fetch failed"))],
            ["OpenAI rate-limits us", () => fetchMock.mockResolvedValue({ ok: false, status: 429 })],
            ["the reply is garbage", () => fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: "not json" } }] }) })],
        ])("should keep the patient moving when %s", async (_label, arrange) => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            arrange();

            const res = await request(app).post(`${API}/${body._id}/extract`).set(auth);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ status: "needs_manual", extractionFailure: "extraction_unavailable" });
        });

        it("should allow a retry after a failure", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            fetchMock.mockRejectedValue(new TypeError("fetch failed"));
            await request(app).post(`${API}/${body._id}/extract`).set(auth);
            openAiReturns(reading);

            const res = await request(app).post(`${API}/${body._id}/extract`).set(auth);

            expect(res.body.status).toBe("extracted");
        });

        it("should handle a file that has already expired", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            await PrescriptionFile.deleteMany({});

            const res = await request(app).post(`${API}/${body._id}/extract`).set(auth);

            expect(res.body).toMatchObject({ status: "needs_manual", extractionFailure: "file_expired" });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("should enforce the per-patient daily limit without calling OpenAI", async () => {
            vi.stubEnv("AI_EXTRACTION_USER_DAILY_LIMIT", "1");
            const { auth } = await signedInUser("Patient");
            const first = await upload(auth);
            const second = await upload(auth);
            openAiReturns(reading);

            await request(app).post(`${API}/${first.body._id}/extract`).set(auth);
            const res = await request(app).post(`${API}/${second.body._id}/extract`).set(auth);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(res.body).toMatchObject({ status: "needs_manual", extractionFailure: "budget_exceeded" });
        });

        it("should enforce the global daily limit across patients", async () => {
            vi.stubEnv("AI_EXTRACTION_DAILY_LIMIT", "1");
            const a = await signedInUser("Patient");
            const b = await signedInUser("Patient");
            const first = await upload(a.auth);
            const second = await upload(b.auth);
            openAiReturns(reading);

            await request(app).post(`${API}/${first.body._id}/extract`).set(a.auth);
            const res = await request(app).post(`${API}/${second.body._id}/extract`).set(b.auth);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(res.body.extractionFailure).toBe("budget_exceeded");
        });

        it("should never log document text or who it belongs to", async () => {
            const { auth, user } = await signedInUser("Patient");
            const { body } = await upload(auth);
            openAiReturns(reading);

            await request(app).post(`${API}/${body._id}/extract`).set(auth);

            const logs = infoSpy.mock.calls.flat().join(" ");
            expect(logs).toContain("prescription_extraction");
            for (const secret of ["Salbutamol", "wheezing", String(user._id), body._id, user.email]) {
                expect(logs).not.toContain(secret);
            }
        });

        it("should store usage as counts only", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            openAiReturns(reading);

            await request(app).post(`${API}/${body._id}/extract`).set(auth);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const usage = await AiUsage.find().lean();
            expect(usage.find((u) => u.kind === "metric")).toMatchObject({ outcome: "ok", count: 1, tokens: 900 });
            expect(JSON.stringify(usage)).not.toContain("Salbutamol");
        });
    });

    describe("verification", () => {
        const verified = { confirmed: true, medications: [{ name: "Salbutamol", details: "2 puffs" }], findings: ["wheezing"] };

        it("should use the patient's corrections, not the model's reading", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            openAiReturns({ ...reading, medications: [{ name: "Metformin", details: null, confidence: "low" }], findings: [] });
            await request(app).post(`${API}/${body._id}/extract`).set(auth);

            const res = await request(app).put(`${API}/${body._id}/verification`).set(auth).send(verified);

            expect(res.body.status).toBe("verified");
            expect(res.body.verified.medications[0].name).toBe("Salbutamol");
            expect(res.body.navigation.suggestions[0].specialization).toBe("Pulmonology");
        });

        it("should give no suggestion until the patient has confirmed", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);

            const res = await request(app).put(`${API}/${body._id}/verification`).set(auth).send({ ...verified, confirmed: false });

            expect(res.status).toBe(400);
            expect((await PrescriptionUpload.findById(body._id))?.navigation).toBeNull();
        });

        it("should work from manual entry when AI was never available", async () => {
            vi.stubEnv("OPENAI_API_KEY", "");
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);
            const extracted = await request(app).post(`${API}/${body._id}/extract`).set(auth);
            expect(extracted.body.status).toBe("needs_manual");

            const res = await request(app).put(`${API}/${body._id}/verification`).set(auth).send(verified);

            expect(res.body.navigation.suggestions[0].specialization).toBe("Pulmonology");
        });

        it("should accept an empty confirmation and say it's only a general starting point", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);

            const res = await request(app).put(`${API}/${body._id}/verification`).set(auth).send({ confirmed: true, medications: [], findings: [] });

            expect(res.body.navigation.suggestions[0].specialization).toBe("General Physician");
        });

        it("should delete the original document once verified", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);

            const res = await request(app).put(`${API}/${body._id}/verification`).set(auth).send(verified);

            expect(res.body.hasFile).toBe(false);
            expect(await PrescriptionFile.countDocuments()).toBe(0);
            expect((await request(app).get(`${API}/${body._id}/file`).set(auth)).status).toBe(404);
        });

        it.each([
            ["a medicine with no name", { ...verified, medications: [{ name: " " }] }],
            ["a query object as a name", { ...verified, medications: [{ name: { $ne: null } }] }],
            ["an overlong name", { ...verified, medications: [{ name: "x".repeat(81) }] }],
            ["non-text findings", { ...verified, findings: [{ a: 1 }] }],
            ["too many items", { ...verified, findings: Array(21).fill("cough") }],
            ["missing lists", { confirmed: true }],
        ])("should reject %s", async (_label, payload) => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);

            expect((await request(app).put(`${API}/${body._id}/verification`).set(auth).send(payload)).status).toBe(400);
        });
    });

    describe("deletion", () => {
        it("should remove the record and the file together", async () => {
            const { auth } = await signedInUser("Patient");
            const { body } = await upload(auth);

            expect((await request(app).delete(`${API}/${body._id}`).set(auth)).status).toBe(200);

            expect(await PrescriptionUpload.countDocuments()).toBe(0);
            expect(await PrescriptionFile.countDocuments()).toBe(0);
        });
    });

    it("should identify files by their first bytes", () => {
        expect(detectFileType(fixture("printed.png"))).toBe("image/png");
        expect(detectFileType(fixture("handwritten.jpg"))).toBe("image/jpeg");
        expect(detectFileType(fixture("printed.pdf"))).toBe("application/pdf");
        expect(detectFileType(Buffer.from("GIF89a"))).toBeNull();
        expect(detectFileType(Buffer.alloc(0))).toBeNull();
    });
});
