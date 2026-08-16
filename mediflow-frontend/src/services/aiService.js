import api from "./api";

export const chatSymptoms = (messages) => api.post("/api/ai/symptom-chat", { messages });
