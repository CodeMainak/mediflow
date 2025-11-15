import api from "./api";

export const addMedicalRecord = (recordData) =>
    api.post("/api/records", recordData);

export const getPatientRecords = (patientId) =>
    api.get(`/api/records/${patientId}`);

export const getAllRecords = () => api.get("/api/records");
