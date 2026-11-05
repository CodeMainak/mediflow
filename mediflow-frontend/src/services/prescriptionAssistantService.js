import api from "./api";

const BASE = "/api/prescription-assistant/uploads";

// `consent` is sent only after the patient ticks the box; the server refuses the upload without it.
export const uploadPrescription = (file, { signal, onProgress } = {}) => {
    const form = new FormData();
    form.append("consent", "true");
    form.append("file", file);
    return api.post(BASE, form, {
        signal,
        onUploadProgress: (event) => {
            if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
        },
    });
};

export const extractPrescription = (id, signal) => api.post(`${BASE}/${id}/extract`, null, { signal });

export const verifyPrescription = (id, details, signal) =>
    api.put(`${BASE}/${id}/verification`, { ...details, confirmed: true }, { signal });

export const listPrescriptionUploads = () => api.get(BASE);

export const getPrescriptionFile = (id, signal) => api.get(`${BASE}/${id}/file`, { responseType: "blob", signal });

export const deletePrescriptionUpload = (id) => api.delete(`${BASE}/${id}`);

export const searchDoctorsBySpecialization = (specialization, signal) =>
    api.get("/api/doctors/search", { params: { specialization }, signal });
