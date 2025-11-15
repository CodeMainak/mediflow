import express from "express";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendAppointmentReminder,
} from "../controllers/notificationController";
import { protect, onlyRole } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for the logged-in user
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark a notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Delete a notification
router.delete("/:id", deleteNotification);

// Clear all notifications
router.delete("/clear-all", clearAllNotifications);

// Send manual appointment reminder (Doctor, Receptionist, Admin only)
router.post(
    "/send-reminder/:appointmentId",
    onlyRole(["Doctor", "Receptionist", "Admin"]),
    sendAppointmentReminder
);

export default router;
