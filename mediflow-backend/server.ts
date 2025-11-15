import { connectDB } from "./src/config/db";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";

// Routes
import authRoutes from "./src/routes/authRoutes";
import appointmentRoutes from "./src/routes/appointmentRoutes";
import prescriptionRoutes from "./src/routes/prescriptionRoutes";
import medicalRecordRoutes from "./src/routes/medicalRecordRoutes";
import messageRoutes from "./src/routes/messageRoutes";
import notificationRoutes from "./src/routes/notificationRoutes";
import adminRoutes from "./src/routes/adminRoutes";
import doctorRoutes from "./src/routes/doctorRoutes";

// Middleware
import {
    helmetMiddleware,
    authLimiter,
    apiLimiter,
} from "./src/middlewares/securityMiddleware";

// Services
import { initializeSocket } from "./src/services/socketService";
import { startReminderScheduler } from "./src/services/reminderScheduler";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Security Middleware
app.use(helmetMiddleware);

// CORS Configuration
app.use(
    cors({
        origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
        credentials: true,
    })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Apply general API rate limiting
app.use("/api/", apiLimiter);

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "MediFlow API is running",
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

const PORT = process.env['PORT'] || 8000;
server.listen(PORT, () => {

    // Start appointment reminder scheduler
    startReminderScheduler();
});
