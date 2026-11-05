import { connectDB } from "./src/config/db";
import dotenv from "dotenv";
import http from "http";

// Services
import { initializeSocket } from "./src/services/socketService";
import { startReminderScheduler } from "./src/services/reminderScheduler";
import { createApp } from "./src/app";

dotenv.config();

// Tokens must never be signed or verified with a guessable default.
if (!process.env["JWT_SECRET"]) {
    console.error("JWT_SECRET is not set. Refusing to start.");
    process.exit(1);
}

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

const PORT = process.env['PORT'] || 8000;
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`MediFlow backend running on http://localhost:${PORT}`);
        // Start appointment reminder scheduler
        startReminderScheduler();
    });
});
