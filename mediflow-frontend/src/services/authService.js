import api from "./api";

export const login = (credentials) => api.post("/api/auth/login", credentials);

export const signup = (data) => api.post("/api/auth/signup", data);

export const getCurrentUser = () => api.get("/api/auth/me");
