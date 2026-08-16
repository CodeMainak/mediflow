import axios from "axios";

// Also used by SocketContext — the Socket.IO connection needs the same
// backend origin as REST calls, not a same-origin relative path (there's
// no nginx proxy between the Vercel frontend and Render backend).
export const API_BASE_URL = import.meta.env.DEV
    ? "http://localhost:8000"
    : (import.meta.env.VITE_API_URL || "");

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
