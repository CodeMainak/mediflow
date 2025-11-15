import api from "./api";

// Create a new prescription (Doctor only)
export const createPrescription = (prescriptionData) =>
    api.post("/api/prescriptions", prescriptionData);

// Update prescription (Doctor only)
export const updatePrescription = (prescriptionId, prescriptionData) =>
    api.put(`/api/prescriptions/${prescriptionId}`, prescriptionData);

// Get prescriptions for a specific patient
export const getPatientPrescriptions = (patientId) =>
    api.get(`/api/prescriptions/patient/${patientId}`);

// Get all prescriptions for the current user (role-based)
export const getMyPrescriptions = () =>
    api.get("/api/prescriptions/my");

// Get prescription by ID
export const getPrescriptionById = (prescriptionId) =>
    api.get(`/api/prescriptions/${prescriptionId}`);

// Delete prescription (Doctor only)
export const deletePrescription = (prescriptionId) =>
    api.delete(`/api/prescriptions/${prescriptionId}`);
