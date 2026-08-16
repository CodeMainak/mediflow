import api from "./api";

export const chatSymptoms = (messages) => api.post("/api/ai/symptom-chat", { messages });

// Public, unauthenticated version used on the /demo page — same real
// backend logic, no account needed.
export const chatSymptomsDemo = (messages) => api.post("/api/ai/demo/symptom-chat", { messages });
