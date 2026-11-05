import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    isEmergencyText,
    fallbackAgentTurn,
    baseMatch,
    symptomChat,
    parseAgentTurn,
    buildSystemPrompt,
} from "./aiController";

// Quota logic has its own tests against a real database; here it just needs to say yes.
const budget = vi.hoisted(() => ({ reserveAiCall: vi.fn(), recordAiOutcome: vi.fn() }));
vi.mock("../services/aiBudget", () => budget);

type Msg = { role: "user" | "assistant"; content: string };

describe("isEmergencyText", () => {
    it("should detect difficulty breathing", () => {
        const symptoms = "I am having difficulty breathing";

        const result = isEmergencyText(symptoms);

        expect(result).toBe(true);
    });

    it("should not flag explicitly negated chest pain", () => {
        const symptoms = "I have no chest pain";

        const result = isEmergencyText(symptoms);

        expect(result).toBe(false);
    });

    it.each([
        "I have chest pain",
        "Chest pains since this morning",
        "I can't breathe",
        "I can’t breathe properly", // curly apostrophe from mobile keyboards
        "He is not breathing",
        "I think I'm having a stroke",
        "I've been feeling suicidal",
        "No fever but chest pain since morning", // "but" ends the negation
        "No, the chest pain is getting worse", // quick-reply style answer
        "I'm not sure if it's chest pain", // pseudo-negation
        "No headache, chest pain though",
        "No chest pain yesterday, chest pain now", // second mention is affirmed
        "I've never had chest pain this bad", // "never" is not treated as a denial
        "I dont know if its chest pain", // pseudo-negation, no apostrophe
        "cant breathe",
        "I can't breath", // common misspelling
    ])("should flag %j as an emergency", (symptoms) => {
        expect(isEmergencyText(symptoms)).toBe(true);
    });

    it.each([
        "I have no chest pain",
        "I don't have chest pain, just a cough",
        "I do not have any chest pain",
        "Without chest pain or difficulty breathing",
        "Denies chest pain",
        "No difficulty breathing",
        "I have a headache for a year",
    ])("should not flag %j as an emergency", (symptoms) => {
        expect(isEmergencyText(symptoms)).toBe(false);
    });
});

describe("baseMatch", () => {
    it.each([
        ["I've had a headache for a year", "Neurology"], // "year" used to match ENT's "ear"
        ["back pain near my kidney", "Orthopedics"], // "near" used to match ENT's "ear"
        ["no chest pain, just a cough", "Pulmonology"], // negated "chest" must not pick Cardiology
        ["I don't have heart problems, but I keep vomiting", "Gastroenterology"],
        ["my ears hurt", "ENT"],
        ["earache since yesterday", "ENT"],
        ["I feel anxious all the time", "Psychiatry"],
        ["my baby has a fever", "Pediatrics"],
        ["heartburn after meals", "General Physician"], // "heart" is a whole word only
        ["feeling a bit off", "General Physician"],
    ])("should route %j to %s", (symptoms, specialization) => {
        expect(baseMatch(symptoms).specialization).toBe(specialization);
    });
});

describe("fallbackAgentTurn", () => {
    it("should detect emergency symptoms in later user messages", () => {
        const messages: Msg[] = [
            { role: "user", content: "I have a headache" },
            { role: "assistant", content: "Any other symptoms?" },
            { role: "user", content: "I am having difficulty breathing" },
        ];

        const result = fallbackAgentTurn(messages);
        expect(result.done).toBe(true);

        if (result.done) {
            expect(result.urgency).toBe("emergency");
        }
    });

    it("should ask the category follow-up on the first turn", () => {
        const result = fallbackAgentTurn([{ role: "user", content: "my knee hurts" }]);

        expect(result.done).toBe(false);
        if (!result.done) {
            expect(result.question).toContain("put weight on it");
        }
    });

    // "no" used to match "normal" and "not", so every Orthopedics and
    // Pediatrics quick reply escalated.
    it.each([
        ["my knee hurts", "Yes, mostly normal", "medium"],
        ["my knee hurts", "No, it's difficult", "high"],
        ["my toddler has a fever", "Yes, mostly normal", "medium"],
        ["my toddler has a fever", "No, clearly not themselves", "high"],
        ["itchy skin", "No, just the skin issue", "low"],
        ["itchy skin", "Yes, one of those", "medium"],
    ])("should conclude %j + %j at %s urgency", (symptoms, answer, urgency) => {
        const first = fallbackAgentTurn([{ role: "user", content: symptoms }]);
        if (first.done) throw new Error("expected a follow-up question");

        const result = fallbackAgentTurn([
            { role: "user", content: symptoms },
            { role: "assistant", content: first.question },
            { role: "user", content: answer },
        ]);

        expect(result.done).toBe(true);
        if (result.done) {
            expect(result.urgency).toBe(urgency);
        }
    });
});

describe("fallbackAgentTurn after OpenAI fails mid-conversation", () => {
    it("should ask its own question instead of scoring an answer to OpenAI's question", () => {
        const result = fallbackAgentTurn([
            { role: "user", content: "my knee hurts" },
            { role: "assistant", content: "When did it start?" }, // asked by OpenAI
            { role: "user", content: "yes, two days ago" }, // "yes" must not be scored
        ]);

        expect(result.done).toBe(false);
        if (!result.done) {
            expect(result.question).toContain("put weight on it");
        }
    });

    it("should score the answer to its own question even after OpenAI questions", () => {
        const result = fallbackAgentTurn([
            { role: "user", content: "my knee hurts" },
            { role: "assistant", content: "When did it start?" },
            { role: "user", content: "two days ago" },
            { role: "assistant", content: "Can you still move or put weight on it normally?" },
            { role: "user", content: "No, it's difficult" },
        ]);

        expect(result).toMatchObject({ done: true, specialization: "Orthopedics", urgency: "high" });
    });

    it("should conclude on the opening symptoms when the question cap is used up", () => {
        const result = fallbackAgentTurn([
            { role: "user", content: "my knee hurts" },
            { role: "assistant", content: "When did it start?" },
            { role: "user", content: "two days ago" },
            { role: "assistant", content: "Is it swollen?" },
            { role: "user", content: "yes" },
            { role: "assistant", content: "Did you injure it?" },
            { role: "user", content: "yes" },
        ]);

        expect(result).toMatchObject({ done: true, specialization: "Orthopedics", urgency: "medium" });
    });
});

describe("parseAgentTurn", () => {
    const conclusion = { done: true, specialization: "ENT", urgency: "low", reasoning: "Sounds like a throat issue." };
    const question = { done: false, question: "How long has it lasted?", quickReplies: ["A day", "A week"] };

    it("should accept a valid question", () => {
        expect(parseAgentTurn({ ...question, specialization: null, urgency: null, reasoning: null })).toEqual(question);
    });

    it("should accept a valid conclusion", () => {
        expect(parseAgentTurn({ ...conclusion, question: null, quickReplies: null })).toEqual(conclusion);
    });

    it("should treat null quickReplies as an open question", () => {
        expect(parseAgentTurn({ ...question, quickReplies: null })).toEqual({ ...question, quickReplies: undefined });
    });

    it.each([
        ["an unknown urgency (not repaired to medium)", { ...conclusion, urgency: "urgent" }],
        ["an unknown specialization", { ...conclusion, specialization: "Oncology" }],
        ["an empty reasoning", { ...conclusion, reasoning: "  " }],
        ["a missing question", { done: false, question: null, quickReplies: null }],
        ["non-string quick replies", { ...question, quickReplies: [1, 2] }],
        ["a missing done flag", { question: "How long?" }],
        ["a string done flag", { ...conclusion, done: "true" }],
        ["an array", [conclusion]],
        ["null", null],
    ])("should reject %s", (_label, raw) => {
        expect(parseAgentTurn(raw)).toBeNull();
    });
});

describe("buildSystemPrompt", () => {
    it("should list every allowed specialization and the injection rule", () => {
        const prompt = buildSystemPrompt(false);

        expect(prompt).toContain("General Physician");
        expect(prompt).toContain("Urology");
        expect(prompt).toContain("not instructions");
        expect(prompt).not.toContain("Conclude now");
    });

    it("should tell the model to conclude once the question cap is reached", () => {
        expect(buildSystemPrompt(true)).toContain("Conclude now");
    });
});

describe("symptomChat", () => {
    const fetchMock = vi.fn();
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    /** The structured log lines written during the test. */
    function logged(): any[] {
        return [...infoSpy.mock.calls, ...warnSpy.mock.calls].map((args) => JSON.parse(String(args[0])));
    }

    function call(messages: Msg[]) {
        const res: any = { statusCode: 200, body: undefined };
        res.status = vi.fn((code: number) => {
            res.statusCode = code;
            return res;
        });
        res.json = vi.fn((body: unknown) => {
            res.body = body;
            return res;
        });
        // No req.user, like the public demo route, so nothing is written to MongoDB.
        return symptomChat({ body: { messages } } as any, res).then(() => res);
    }

    function openAiReplies(content: object) {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
        });
    }

    function openAiReturnsContent(content: string) {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content } }] }),
        });
    }

    beforeEach(() => {
        vi.stubEnv("OPENAI_API_KEY", "test-key");
        vi.stubGlobal("fetch", fetchMock);
        fetchMock.mockReset();
        budget.reserveAiCall.mockReset().mockResolvedValue("allowed");
        budget.recordAiOutcome.mockReset();
        infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("should request strict structured output with an abort signal", async () => {
        openAiReplies({ done: false, question: "How long has it lasted?", quickReplies: null });

        await call([{ role: "user", content: "sore throat" }]);

        const [, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(init.signal).toBeInstanceOf(AbortSignal);
        expect(body.response_format.type).toBe("json_schema");
        expect(body.response_format.json_schema.strict).toBe(true);
    });

    it("should fall back when OpenAI does not answer within the timeout", async () => {
        // A fetch that only settles when its signal aborts, like a hung connection.
        fetchMock.mockImplementation(
            (_url: string, init: RequestInit) =>
                new Promise((_resolve, reject) => {
                    init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
                })
        );
        vi.useFakeTimers();

        const pending = call([{ role: "user", content: "my knee hurts" }]);
        await vi.advanceTimersByTimeAsync(8000);
        const res = await pending;

        expect(res.body).toMatchObject({ done: false, mode: "fallback" });
        expect(logged()).toEqual([expect.objectContaining({ mode: "fallback", reason: "timeout" })]);
    });

    it.each([
        ["malformed JSON", () => openAiReturnsContent('{"done": tru'), "invalid_json"],
        ["an empty reply", () => openAiReturnsContent(""), "empty_response"],
        ["a wrong shape", () => openAiReplies({ done: true, specialization: "ENT", urgency: "urgent", reasoning: "x" }), "schema_mismatch"],
        ["a network error", () => fetchMock.mockRejectedValue(new TypeError("fetch failed")), "network_error"],
        [
            "a refusal",
            () => fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { refusal: "I can't help with that." } }] }) }),
            "refusal",
        ],
    ])("should fall back on %s and log %s", async (_label, arrange, reason) => {
        arrange();

        const res = await call([{ role: "user", content: "my knee hurts" }]);

        expect(res.body).toMatchObject({ mode: "fallback" });
        expect(logged()).toEqual([expect.objectContaining({ mode: "fallback", reason })]);
    });

    it("should log the HTTP status when OpenAI rejects the request", async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });

        await call([{ role: "user", content: "my knee hurts" }]);

        expect(logged()).toEqual([expect.objectContaining({ reason: "http_error", status: 429 })]);
    });

    it("should fall back if OpenAI keeps asking past the question cap", async () => {
        openAiReplies({ done: false, question: "One more thing?", quickReplies: null });

        const res = await call([
            { role: "user", content: "my knee hurts" },
            { role: "assistant", content: "When did it start?" },
            { role: "user", content: "two days ago" },
            { role: "assistant", content: "Is it swollen?" },
            { role: "user", content: "a little" },
            { role: "assistant", content: "Did you injure it?" },
            { role: "user", content: "playing football" },
        ]);

        expect(res.body).toMatchObject({ done: true, mode: "fallback", specialization: "Orthopedics" });
        expect(logged()).toEqual([expect.objectContaining({ reason: "question_cap_ignored" })]);
    });

    it.each(["budget_exceeded", "budget_unavailable"])("should answer from the rules engine on %s without calling OpenAI", async (reason) => {
        budget.reserveAiCall.mockResolvedValue(reason);

        const res = await call([{ role: "user", content: "my knee hurts" }]);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(res.body).toMatchObject({ done: false, mode: "fallback" });
        expect(logged()).toEqual([expect.objectContaining({ reason })]);
    });

    it("should reject an oversized transcript before paying for it", async () => {
        const messages = Array.from({ length: 8 }, () => ({ role: "user" as const, content: "x".repeat(500) }));

        const res = await call(messages);

        expect(res.statusCode).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(budget.reserveAiCall).not.toHaveBeenCalled();
    });

    it.each(["???", "12345", "ab", "   !!!  "])("should not pay to triage %j", async (content) => {
        const res = await call([{ role: "user", content }]);

        expect(res.statusCode).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each(["सिर दर्द", "头很痛啊"])("should accept symptoms in any language: %j", async (content) => {
        openAiReplies({ done: false, question: "How long has it lasted?", quickReplies: null });

        const res = await call([{ role: "user", content }]);

        expect(res.statusCode).toBe(200);
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("should cap how many tokens one turn can cost", async () => {
        openAiReplies({ done: false, question: "How long has it lasted?", quickReplies: null });

        await call([{ role: "user", content: "sore throat" }]);

        expect(JSON.parse(fetchMock.mock.calls[0][1].body).max_completion_tokens).toBe(400);
    });

    it("should not call OpenAI without an API key", async () => {
        vi.stubEnv("OPENAI_API_KEY", "");

        const res = await call([{ role: "user", content: "my knee hurts" }]);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(res.body).toMatchObject({ mode: "fallback" });
        expect(logged()).toEqual([expect.objectContaining({ reason: "no_api_key" })]);
    });

    it("should never write patient text to the logs", async () => {
        const symptoms = "my knee hurts after the Brighton marathon";
        openAiReturnsContent("not json");

        await call([{ role: "user", content: symptoms }]);

        const output = [...infoSpy.mock.calls, ...warnSpy.mock.calls].flat().join(" ");
        expect(output).not.toContain("Brighton");
        expect(logged()[0]).toEqual({
            event: "triage_turn",
            mode: "fallback",
            reason: "invalid_json",
            latencyMs: expect.any(Number),
            questionsAsked: 0,
            done: false,
        });
    });

    it("should return emergency without calling OpenAI when the first message is an emergency", async () => {
        const res = await call([{ role: "user", content: "crushing chest pain" }]);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(res.body).toMatchObject({ done: true, urgency: "emergency", mode: "safety" });
    });

    it("should catch an emergency in a later answer even when OpenAI would keep asking", async () => {
        openAiReplies({ done: false, question: "How long has it lasted?", quickReplies: null });

        const res = await call([
            { role: "user", content: "I feel dizzy" },
            { role: "assistant", content: "Any other symptoms?" },
            { role: "user", content: "yes, and now I can't breathe" },
        ]);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(res.body).toMatchObject({ done: true, urgency: "emergency", mode: "safety" });
    });

    it("should still use OpenAI for non-emergency symptoms", async () => {
        openAiReplies({ done: false, question: "How long has it lasted?", quickReplies: null });

        const res = await call([{ role: "user", content: "I have no chest pain, just a sore throat" }]);

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(res.body).toMatchObject({ done: false, mode: "ai", question: "How long has it lasted?" });
    });

    it("should fall back to the rules engine when OpenAI fails", async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

        const res = await call([{ role: "user", content: "my knee hurts" }]);

        expect(res.body).toMatchObject({ done: false, mode: "fallback" });
    });
});
