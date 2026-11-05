import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "./app";
import { User } from "./models/User";
import { Appointment } from "./models/Appointment";
import { MedicalRecord } from "./models/MedicalRecord";
import { DoctorProfile } from "./models/DoctorProfile";
import { SymptomCheck } from "./models/SymptomCheck";
import { PrescriptionUpload } from "./models/PrescriptionUpload";
import { PrescriptionFile } from "./models/PrescriptionFile";
import { isAllowedOrigin, hideServerErrorDetails } from "./middlewares/securityMiddleware";
import { reserveAiCall, recordAiOutcome, getUsageSummary } from "./services/aiBudget";
import { startDatabase, stopDatabase, clearDatabase, signedInUser } from "./test/harness";

const app = createApp();

describe("security", () => {
    beforeAll(startDatabase);
    afterAll(stopDatabase);
    beforeEach(clearDatabase);
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("signup and login", () => {
        const signup = (body: object) => request(app).post("/api/auth/signup").send(body);
        const person = { name: "New Person", email: "new@example.test", password: "long-enough-1" };

        it("should ignore a requested role, so nobody can register as Admin", async () => {
            const res = await signup({ ...person, role: "Admin" });

            expect(res.status).toBe(201);
            expect((await User.findOne({ email: person.email }))?.role).toBe("Patient");
        });

        it("should never return the password hash", async () => {
            const res = await signup(person);

            expect(JSON.stringify(res.body)).not.toContain("password");
        });

        it.each([
            ["a short password", { ...person, password: "short" }],
            ["a query object as the email", { ...person, email: { $ne: null } }],
            ["a bad email", { ...person, email: "nope" }],
            ["no name", { ...person, name: " " }],
        ])("should reject %s", async (_label, body) => {
            expect((await signup(body)).status).toBe(400);
        });

        it("should reject NoSQL injection on login", async () => {
            await signedInUser("Admin");

            const res = await request(app).post("/api/auth/login").send({ email: { $ne: null }, password: "x" });

            expect(res.status).toBe(400);
        });

        it("should reject a token signed with a guessable old default", async () => {
            const { user } = await signedInUser("Patient");
            for (const secret of ["supersecret", "some-other-secret"]) {
                const forged = jwt.sign({ id: user._id, role: "Admin" }, secret);
                const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${forged}`);
                expect(res.status).toBe(401);
            }
        });

        it("should reject an unsigned token", async () => {
            const { user } = await signedInUser("Patient");
            const none = jwt.sign({ id: user._id }, "", { algorithm: "none" });

            expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${none}`)).status).toBe(401);
        });

        it("should take the role from the database, not the token", async () => {
            const { user } = await signedInUser("Patient");
            const claimsAdmin = jwt.sign({ id: user._id, role: "Admin" }, process.env["JWT_SECRET"] as string);

            const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${claimsAdmin}`);

            expect(res.status).toBe(403);
        });
    });

    describe("admin endpoints", () => {
        const newUser = (role: string) => ({ name: "Someone", email: `${role}@example.test`, password: "long-enough-1", role });

        it("should stop a receptionist creating an admin", async () => {
            const { auth } = await signedInUser("Receptionist");

            expect((await request(app).post("/api/admin/users").set(auth).send(newUser("Admin"))).status).toBe(403);
            expect((await request(app).post("/api/admin/users").set(auth).send(newUser("Doctor"))).status).toBe(201);
        });

        it("should stop a receptionist promoting anyone", async () => {
            const { auth, user } = await signedInUser("Receptionist");
            const patient = await signedInUser("Patient");

            const self = await request(app).patch(`/api/admin/users/${user._id}`).set(auth).send({ role: "Admin" });
            const other = await request(app).patch(`/api/admin/users/${patient.user._id}`).set(auth).send({ role: "Admin" });

            expect(self.status).toBe(403);
            expect(other.status).toBe(403);
            expect((await User.findById(patient.user._id))?.role).toBe("Patient");
        });

        it("should stop a receptionist editing an admin", async () => {
            const { auth } = await signedInUser("Receptionist");
            const admin = await signedInUser("Admin");

            const res = await request(app).patch(`/api/admin/users/${admin.user._id}`).set(auth).send({ email: "taken@example.test" });

            expect(res.status).toBe(403);
        });

        it("should let a receptionist edit a patient's profile and an admin change a role", async () => {
            const receptionist = await signedInUser("Receptionist");
            const admin = await signedInUser("Admin");
            const patient = await signedInUser("Patient");

            expect((await request(app).patch(`/api/admin/users/${patient.user._id}`).set(receptionist.auth).send({ phone: "123" })).status).toBe(200);
            expect((await request(app).patch(`/api/admin/users/${patient.user._id}`).set(admin.auth).send({ role: "Doctor" })).status).toBe(200);
        });

        it("should not let this route set a password", async () => {
            const admin = await signedInUser("Admin");
            const patient = await signedInUser("Patient");

            await request(app).patch(`/api/admin/users/${patient.user._id}`).set(admin.auth).send({ password: "changed" });

            expect((await User.findById(patient.user._id))?.password).toBe("not-a-real-hash");
        });

        it("should treat search as literal text, not a regex", async () => {
            const admin = await signedInUser("Admin");

            const res = await request(app).get("/api/admin/users").query({ search: "(a+)+$" }).set(admin.auth);

            expect(res.status).toBe(200);
            expect(res.body.data ?? res.body.users ?? []).toEqual([]);
        });

        it("should delete a patient's health data along with the account", async () => {
            const admin = await signedInUser("Admin");
            const patient = await signedInUser("Patient");
            await SymptomCheck.create({ patient: patient.user._id, symptoms: "x", specialization: "ENT", urgency: "low", reasoning: "x", selfCare: "x", mode: "ai" });
            const upload = await PrescriptionUpload.create({ patient: patient.user._id, mimeType: "image/png", sizeBytes: 1, consentVersion: "v", consentedAt: new Date(), expiresAt: new Date(Date.now() + 1e6) });
            await PrescriptionFile.create({ upload: upload._id, patient: patient.user._id, data: Buffer.from("x"), mimeType: "image/png", expiresAt: new Date(Date.now() + 1e6) });

            expect((await request(app).delete(`/api/admin/users/${patient.user._id}`).set(admin.auth)).status).toBe(200);

            expect(await SymptomCheck.countDocuments()).toBe(0);
            expect(await PrescriptionUpload.countDocuments()).toBe(0);
            expect(await PrescriptionFile.countDocuments()).toBe(0);
        });
    });

    describe("records and appointments", () => {
        async function appointmentFor(patientId: unknown, doctorId: unknown) {
            return Appointment.create({ patientId, doctorId, date: new Date(Date.now() + 864e5), time: "10:00", status: "pending" } as any);
        }

        it("should stop a doctor deleting another doctor's medical record", async () => {
            const a = await signedInUser("Doctor");
            const b = await signedInUser("Doctor");
            const patient = await signedInUser("Patient");
            const record = await MedicalRecord.create({ patient: patient.user._id, doctor: a.user._id, diagnosis: "x", prescription: "x" });

            expect((await request(app).delete(`/api/medical-records/${record._id}`).set(b.auth)).status).toBe(404);
            expect(await MedicalRecord.countDocuments()).toBe(1);
            expect((await request(app).delete(`/api/medical-records/${record._id}`).set(a.auth)).status).toBe(200);
        });

        it("should hide an appointment from patients and doctors who aren't on it", async () => {
            const patient = await signedInUser("Patient");
            const stranger = await signedInUser("Patient");
            const doctor = await signedInUser("Doctor");
            const otherDoctor = await signedInUser("Doctor");
            const desk = await signedInUser("Receptionist");
            const appointment = await appointmentFor(patient.user._id, doctor.user._id);
            const url = `/api/appointments/${appointment._id}`;

            expect((await request(app).get(url).set(stranger.auth)).status).toBe(404);
            expect((await request(app).get(url).set(otherDoctor.auth)).status).toBe(404);
            expect((await request(app).get(url).set(patient.auth)).status).toBe(200);
            expect((await request(app).get(url).set(doctor.auth)).status).toBe(200);
            expect((await request(app).get(url).set(desk.auth)).status).toBe(200);
        });

        it("should stop a doctor changing another doctor's appointment status", async () => {
            const patient = await signedInUser("Patient");
            const doctor = await signedInUser("Doctor");
            const otherDoctor = await signedInUser("Doctor");
            const appointment = await appointmentFor(patient.user._id, doctor.user._id);

            const res = await request(app).patch(`/api/appointments/${appointment._id}/status`).set(otherDoctor.auth).send({ status: "cancelled" });

            expect(res.status).toBe(404);
            expect((await Appointment.findById(appointment._id))?.status).toBe("pending");
        });

        it("should allow only one of two simultaneous bookings for a slot", async () => {
            const a = await signedInUser("Patient");
            const b = await signedInUser("Patient");
            const doctor = await signedInUser("Doctor");
            const booking = { doctorId: doctor.user._id, date: "2030-01-15", time: "10:00" };

            const results = await Promise.all([
                request(app).post("/api/appointments").set(a.auth).send(booking),
                request(app).post("/api/appointments").set(b.auth).send(booking),
            ]);

            expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
            expect(await Appointment.countDocuments()).toBe(1);
        });

        it("should free a slot when an appointment is cancelled", async () => {
            const a = await signedInUser("Patient");
            const doctor = await signedInUser("Doctor");
            const booking = { doctorId: doctor.user._id, date: "2030-01-16", time: "10:00" };
            const first = await request(app).post("/api/appointments").set(a.auth).send(booking);
            await Appointment.updateOne({ _id: first.body._id }, { status: "cancelled" });

            expect((await request(app).post("/api/appointments").set(a.auth).send(booking)).status).toBe(201);
        });

        it("should not reveal the other patient's appointment on a conflict", async () => {
            const a = await signedInUser("Patient");
            const b = await signedInUser("Patient");
            const doctor = await signedInUser("Doctor");
            const booking = { doctorId: doctor.user._id, date: "2030-01-17", time: "10:00" };
            await request(app).post("/api/appointments").set(a.auth).send({ ...booking, reason: "private reason" });

            const res = await request(app).post("/api/appointments").set(b.auth).send(booking);

            expect(res.status).toBe(409);
            expect(JSON.stringify(res.body)).not.toContain("private reason");
            expect(JSON.stringify(res.body)).not.toContain(String(a.user._id));
        });

        it("should reach clear-all instead of treating it as an id", async () => {
            const { auth } = await signedInUser("Patient");

            expect((await request(app).delete("/api/notifications/clear-all").set(auth)).status).toBe(200);
        });
    });

    describe("doctor search", () => {
        it("should find doctors on a profile or a user, and only expose public fields", async () => {
            const { auth } = await signedInUser("Patient");
            const withProfile = await signedInUser("Doctor", { phone: "555", address: "Home" });
            await DoctorProfile.create({ user: withProfile.user._id, specialization: "Cardiology", experience: 9, availability: [] });
            const userOnly = await signedInUser("Doctor", { specialization: "cardiology", phone: "555" });
            await signedInUser("Doctor", { specialization: "ENT" });

            const res = await request(app).get("/api/doctors/search").query({ specialization: "Cardiology" }).set(auth);

            expect(res.status).toBe(200);
            expect(res.body.map((d: any) => d._id).sort()).toEqual([String(withProfile.user._id), String(userOnly.user._id)].sort());
            expect(JSON.stringify(res.body)).not.toMatch(/555|Home|password/);
        });

        it("should match General Physician to doctors listed as General Medicine", async () => {
            const { auth } = await signedInUser("Patient");
            const doctor = await signedInUser("Doctor", { specialization: "General Medicine" });

            const res = await request(app).get("/api/doctors/search").query({ specialization: "General Physician" }).set(auth);

            expect(res.body[0]._id).toBe(String(doctor.user._id));
        });

        it("should treat the search term as literal text", async () => {
            const { auth } = await signedInUser("Patient");
            await signedInUser("Doctor", { specialization: "ENT" });

            const res = await request(app).get("/api/doctors/search").query({ specialization: ".*" }).set(auth);

            expect(res.body).toEqual([]);
        });

        it("should reject a missing specialization", async () => {
            const { auth } = await signedInUser("Patient");

            expect((await request(app).get("/api/doctors/search").set(auth)).status).toBe(400);
        });

        it("should not expose private fields in the doctor list", async () => {
            const { auth } = await signedInUser("Patient");
            await signedInUser("Doctor", { phone: "555", address: "Home" });

            const res = await request(app).get("/api/doctors").set(auth);

            expect(JSON.stringify(res.body)).not.toMatch(/555|Home|password/);
        });
    });

    describe("CORS", () => {
        it("should allow the production frontend and configured origins only", () => {
            vi.stubEnv("NODE_ENV", "production");
            vi.stubEnv("ALLOWED_ORIGINS", "https://clinic.example.test/, https://other.example.test");

            expect(isAllowedOrigin("https://mediflow-frontend-sigma.vercel.app")).toBe(true);
            expect(isAllowedOrigin("https://clinic.example.test")).toBe(true);
            expect(isAllowedOrigin("https://other.example.test")).toBe(true);
            expect(isAllowedOrigin(undefined)).toBe(true);
            expect(isAllowedOrigin("https://evil.example.test")).toBe(false);
            expect(isAllowedOrigin("http://localhost:3000")).toBe(false);
        });

        it("should send no CORS header to an unknown origin", async () => {
            const res = await request(app).get("/api/health").set("Origin", "https://evil.example.test");

            expect(res.status).toBe(200);
            expect(res.headers["access-control-allow-origin"]).toBeUndefined();
            expect(res.headers["access-control-allow-credentials"]).toBeUndefined();
        });

        it("should allow localhost in development", async () => {
            const res = await request(app).get("/api/health").set("Origin", "http://localhost:3000");

            expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
        });
    });

    describe("production failures", () => {
        it("should strip error details from a 500 and log only the route and error name", () => {
            const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
            const sent: unknown[] = [];
            const res: any = { statusCode: 500, json: (b: unknown) => sent.push(b) };

            hideServerErrorDetails({ method: "GET", baseUrl: "/api/x", route: { path: "/:id" } } as any, res, () => { });
            res.json({ msg: "Server error", err: new TypeError("patient Jane has chest pain"), error: "details" });

            expect(sent[0]).toEqual({ msg: "Server error" });
            const log = errorSpy.mock.calls.flat().join(" ");
            expect(log).toContain("GET /api/x/:id");
            expect(log).toContain("TypeError");
            expect(log).not.toContain("Jane");
        });

        it("should leave 4xx responses alone", () => {
            const sent: unknown[] = [];
            const res: any = { statusCode: 400, json: (b: unknown) => sent.push(b) };

            hideServerErrorDetails({} as any, res, () => { });
            res.json({ msg: "Bad", error: "useful to the client" });

            expect(sent[0]).toEqual({ msg: "Bad", error: "useful to the client" });
        });

        it("should return a generic 500 through the real app when the database query fails", async () => {
            vi.spyOn(console, "error").mockImplementation(() => { });
            const { auth } = await signedInUser("Patient");
            vi.spyOn(SymptomCheck, "find").mockImplementation(() => { throw new Error("connection to secret-host failed"); });

            const res = await request(app).get("/api/ai/history").set(auth);

            expect(res.status).toBe(500);
            expect(JSON.stringify(res.body)).not.toContain("secret-host");
        });

        it("should not leak details for malformed JSON", async () => {
            const res = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{bad");

            expect(res.status).toBe(400);
            expect(JSON.stringify(res.body)).not.toContain("node_modules");
        });

        it("should keep triage answering, and still catch emergencies, with OpenAI and the budget database down", async () => {
            vi.stubEnv("OPENAI_API_KEY", "test-key");
            const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
            vi.stubGlobal("fetch", fetchMock);
            vi.spyOn(console, "warn").mockImplementation(() => { });
            vi.spyOn(console, "info").mockImplementation(() => { });
            const readyState = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(0 as any);
            const chat = (content: string) => request(app).post("/api/ai/demo/symptom-chat").send({ messages: [{ role: "user", content }] });

            const routine = await chat("my knee hurts");
            const emergency = await chat("I can't breathe");

            readyState.mockRestore();
            expect(routine.status).toBe(200);
            expect(routine.body.mode).toBe("fallback");
            expect(emergency.body).toMatchObject({ urgency: "emergency", mode: "safety" });
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe("AI budget", () => {
        it("should stop at the per-user limit", async () => {
            vi.stubEnv("AI_TRIAGE_USER_DAILY_LIMIT", "2");

            expect(await reserveAiCall("triage", "u1")).toBe("allowed");
            expect(await reserveAiCall("triage", "u1")).toBe("allowed");
            expect(await reserveAiCall("triage", "u1")).toBe("budget_exceeded");
            expect(await reserveAiCall("triage", "u2")).toBe("allowed");
        });

        it("should never overspend under concurrent calls", async () => {
            vi.stubEnv("AI_TRIAGE_DAILY_LIMIT", "5");

            const results = await Promise.all(Array.from({ length: 20 }, (_, i) => reserveAiCall("triage", `user-${i}`)));

            expect(results.filter((r) => r === "allowed").length).toBeLessThanOrEqual(5);
        });

        it("should give the public demo its own bucket and block extraction there", async () => {
            vi.stubEnv("AI_TRIAGE_DEMO_DAILY_LIMIT", "1");

            expect(await reserveAiCall("triage", null)).toBe("allowed");
            expect(await reserveAiCall("triage", null)).toBe("budget_exceeded");
            expect(await reserveAiCall("prescription_extraction", null)).toBe("budget_exceeded");
        });

        it("should expose totals to admins only, with no user identifiers", async () => {
            const admin = await signedInUser("Admin");
            const patient = await signedInUser("Patient");
            await reserveAiCall("triage", String(patient.user._id));
            recordAiOutcome("triage", "ai", 120);
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect((await request(app).get("/api/admin/ai-usage").set(patient.auth)).status).toBe(403);

            const res = await request(app).get("/api/admin/ai-usage").set(admin.auth);
            expect(res.body.rows).toEqual([expect.objectContaining({ feature: "triage", outcome: "ai", count: 1, tokens: 120 })]);
            expect(JSON.stringify(res.body)).not.toContain(String(patient.user._id));
            expect((await getUsageSummary(7)).limits.triage.perUser).toBe(40);
        });
    });

    describe("symptom history", () => {
        it("should delete only the caller's own history", async () => {
            const a = await signedInUser("Patient");
            const b = await signedInUser("Patient");
            const entry = { symptoms: "x", specialization: "ENT", urgency: "low", reasoning: "x", selfCare: "x", mode: "ai" };
            await SymptomCheck.create([{ ...entry, patient: a.user._id }, { ...entry, patient: b.user._id }]);

            const res = await request(app).delete("/api/ai/history").set(a.auth);

            expect(res.body.deletedCount).toBe(1);
            expect(await SymptomCheck.countDocuments({ patient: b.user._id })).toBe(1);
        });
    });
});
