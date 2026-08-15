import api from "./api";

export const checkSymptoms = (answers) => api.post("/api/ai/symptom-check", answers);
