import api from "./api";

// Update user profile
export const updateProfile = (profileData) =>
    api.patch("/api/auth/profile", profileData);

// Get current user
export const getCurrentUser = () => api.get("/api/auth/me");

// Get all doctors (accessible to all authenticated users)
export const getDoctors = () => {
    return api.get('/api/doctors');
};

// Get all patients (for receptionist/admin) or filtered by role
export const getPatients = (params = {}) => {
    const queryParams = new URLSearchParams({
        role: 'Patient',
        ...params
    }).toString();
    return api.get(`/api/admin/users?${queryParams}`);
};
