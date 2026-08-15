import api from "./api";

export const checkSymptoms = (symptoms) => api.post("/api/ai/symptom-check", { symptoms });
