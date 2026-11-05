import express from "express";
import cors from "cors";

// Routes
import authRoutes from "./routes/authRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import prescriptionRoutes from "./routes/prescriptionRoutes";
import medicalRecordRoutes from "./routes/medicalRecordRoutes";
import messageRoutes from "./routes/messageRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import adminRoutes from "./routes/adminRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import pharmacyRoutes from "./routes/pharmacyRoutes";
import aiRoutes from "./routes/aiRoutes";
import placesRoutes from "./routes/placesRoutes";

// Middleware
import {
    helmetMiddleware,
    apiLimiter,
    corsOrigin,
    hideServerErrorDetails,
} from "./middlewares/securityMiddleware";

/** Builds the Express app without opening a port or a database, so tests can drive it directly. */
export function createApp() {
    const app = express();
    // Render puts one reverse proxy in front of the app; trusting exactly that
    // one hop lets express-rate-limit read the real client IP from
    // X-Forwarded-For instead of throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
    app.set("trust proxy", 1);

    // Security Middleware
    app.use(helmetMiddleware);
    app.use(hideServerErrorDetails);

    // Auth is a bearer token in a header, not a cookie, so credentials stay off.
    app.use(cors({ origin: corsOrigin }));

    // Body Parser
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Apply general API rate limiting
    app.use("/api/", apiLimiter);

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/appointments", appointmentRoutes);
    app.use("/api/prescriptions", prescriptionRoutes);
    app.use("/api/medical-records", medicalRecordRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/doctors", doctorRoutes);
    app.use("/api/pharmacy", pharmacyRoutes);
    app.use("/api/ai", aiRoutes);
    app.use("/api/places", placesRoutes);

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
        const status = err.status || 500;
        res.status(status).json({
            success: false,
            // 4xx messages are written for the client; 5xx messages are internals.
            message: status < 500 ? err.message : "Internal Server Error",
            err,
        });
    });

    return app;
}
