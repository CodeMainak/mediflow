import api from "./api";

// `signal` lets the chat cancel an in-flight request (Cancel button, unmount).
export const chatSymptoms = (messages, signal) => api.post("/api/ai/symptom-chat", { messages }, { signal });

// Public, unauthenticated version used on the /demo page — same real
// backend logic, no account needed.
export const chatSymptomsDemo = (messages, signal) => api.post("/api/ai/demo/symptom-chat", { messages }, { signal });

export const getSymptomHistory = () => api.get("/api/ai/history");
