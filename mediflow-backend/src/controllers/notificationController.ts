import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Notification, INotification } from "../models/Notification";
import { IUser } from "../models/User";
import { sendImmediateReminder } from "../services/reminderScheduler";

// Get all notifications for the logged-in user
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;

        const notifications = await Notification.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        res.status(200).json({ success: true, data: notifications });
    } catch (err: any) {
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

// Get unread notification count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;

        const count = await Notification.countDocuments({
            userId: user._id,
            read: false,
        });

        res.status(200).json({ success: true, count });
    } catch (err: any) {
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

// Mark a notification as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ success: false, msg: "Notification not found" });
            return;
        }

        res.status(200).json({ success: true, data: notification });
    } catch (err: any) {
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;

        await Notification.updateMany(
            { userId: user._id, read: false },
            { read: true }
        );

        res.status(200).json({ success: true, msg: "All notifications marked as read" });
    } catch (err: any) {
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

// Delete a notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId: user._id,
        });

        if (!notification) {
            res.status(404).json({ success: false, msg: "Notification not found" });
            return;
        }

        res.status(200).json({ success: true, msg: "Notification deleted" });
    } catch (err: any) {
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

// Clear all notifications
export const clearAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;

        await Notification.deleteMany({ userId: user._id });

        res.status(200).json({ success: true, msg: "All notifications cleared" });
    } catch (err: any) {
        res.status(500).json({ success: false, msg: "Server error", error: err.message });
    }
};

// Helper function to create a notification (used by other controllers)
export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: "appointment" | "prescription" | "reminder" | "alert",
    relatedId?: string,
    relatedModel?: string
): Promise<INotification | null> => {
    try {
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            relatedId,
            relatedModel,
        });

        // Here you can emit a socket event for real-time notification
        // io.to(userId).emit('notification_received', notification);

        return notification;
    } catch (err: any) {
        return null;
    }
};

// Send manual appointment reminder (Doctor/Admin only)
export const sendAppointmentReminder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;

        if (!appointmentId) {
            res.status(400).json({ success: false, msg: "Appointment ID is required" });
            return;
        }

        const success = await sendImmediateReminder(appointmentId);

        if (success) {
            res.status(200).json({
                success: true,
                msg: "Reminder sent successfully"
            });
        } else {
            res.status(500).json({
                success: false,
                msg: "Failed to send reminder"
            });
        }
    } catch (err: any) {
        res.status(500).json({
            success: false,
            msg: "Server error",
            error: err.message
        });
    }
};
