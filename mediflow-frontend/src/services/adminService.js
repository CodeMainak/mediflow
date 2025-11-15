import api from "./api";

// User Management
export const getAllUsers = (params) => api.get("/api/admin/users", { params });
export const getUserById = (userId) => api.get(`/api/admin/users/${userId}`);
export const createUser = (userData) => api.post("/api/admin/users", userData);
export const updateUser = (userId, userData) => api.patch(`/api/admin/users/${userId}`, userData);
export const deleteUser = (userId) => api.delete(`/api/admin/users/${userId}`);

// System Stats & Monitoring
export const getSystemStats = () => api.get("/api/admin/stats");
export const getActivityLog = (params) => api.get("/api/admin/activity", { params });
