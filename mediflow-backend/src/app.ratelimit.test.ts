import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";

// Limits are chosen when the middleware module loads, so production must be set first.
vi.hoisted(() => {
    process.env["NODE_ENV"] = "production";
});

import { createApp } from "./app";
import { User } from "./models/User";
import { startDatabase, stopDatabase } from "./test/harness";

describe("rate limits in production", () => {
    beforeAll(startDatabase);
    afterAll(stopDatabase);

    it("should count failed logins, but not successful ones or other auth routes", async () => {
        const app = createApp();
        await User.create({ name: "Real", email: "real@example.test", password: await bcrypt.hash("right-password", 4), role: "Patient" });
        const login = (password: string) => request(app).post("/api/auth/login").send({ email: "real@example.test", password });

        for (let i = 0; i < 8; i++) expect((await login("right-password")).status).toBe(200);
        for (let i = 0; i < 12; i++) expect((await request(app).get("/api/auth/me")).status).toBe(401);
        for (let i = 0; i < 5; i++) expect((await login("wrong-password")).status).toBe(400);

        expect((await login("wrong-password")).status).toBe(429);
    });
});
