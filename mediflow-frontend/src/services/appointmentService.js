import api from "./api";

// Create a new appointment (Patient only)
export const bookAppointment = (appointmentData) =>
    api.post("/api/appointments", appointmentData);

// Get all appointments for logged-in user (Patient or Doctor)
export const getAppointments = () => api.get("/api/appointments");

// Get single appointment by ID
export const getAppointmentById = (id) => api.get(`/api/appointments/${id}`);

// Update appointment status (Doctor only - approve/reject)
export const updateAppointmentStatus = (id, status) =>
    api.patch(`/api/appointments/${id}/status`, { status });

// Reschedule appointment (Patient or Doctor)
export const rescheduleAppointment = (id, newDate) =>
    api.patch(`/api/appointments/${id}/reschedule`, { newDate });

// Delete/Cancel appointment (Patient or Doctor)
export const deleteAppointment = (id) =>
    api.delete(`/api/appointments/${id}`);
