import { connectDB } from "../config/db";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const seedNotifications = async () => {
    try {
        await connectDB();

        // Get all users
        const users = await User.find({});

        if (users.length === 0) {
            process.exit(1);
        }

        // Clear existing notifications
        await Notification.deleteMany({});

        // Create sample notifications for each user
        const notifications: any[] = [];

        for (const user of users) {
            // Add 3-5 notifications per user
            const userNotifications: any[] = [
                {
                    userId: user._id,
                    title: "Welcome to MediFlow",
                    message: `Welcome ${user.name}! Your account has been created successfully.`,
                    type: "alert" as const,
                    read: true,
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                },
                {
                    userId: user._id,
                    title: "System Update",
                    message: "MediFlow has been updated with new features. Check out the latest improvements!",
                    type: "alert" as const,
                    read: true,
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                },
                {
                    userId: user._id,
                    title: "Important Reminder",
                    message: "Don't forget to update your profile information for better service.",
                    type: "reminder" as const,
                    read: false,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                },
            ];

            // Role-specific notifications
            if (user.role === "Patient") {
                userNotifications.push(
                    {
                        userId: user._id,
                        title: "Upcoming Appointment",
                        message: "You have an appointment scheduled for next week. Please confirm your availability.",
                        type: "appointment" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                    },
                    {
                        userId: user._id,
                        title: "Prescription Ready",
                        message: "Your prescription is ready for pickup. Visit the pharmacy at your convenience.",
                        type: "prescription" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
                    }
                );
            } else if (user.role === "Doctor") {
                userNotifications.push(
                    {
                        userId: user._id,
                        title: "New Appointment Request",
                        message: "You have a new appointment request from a patient. Please review and approve.",
                        type: "appointment" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    },
                    {
                        userId: user._id,
                        title: "Patient Follow-up Required",
                        message: "Please follow up with patient John Doe regarding their treatment plan.",
                        type: "reminder" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                    }
                );
            } else if (user.role === "Receptionist") {
                userNotifications.push(
                    {
                        userId: user._id,
                        title: "Pending Appointments",
                        message: "There are 5 pending appointment requests waiting for approval.",
                        type: "appointment" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                    },
                    {
                        userId: user._id,
                        title: "New Patient Registration",
                        message: "A new patient has registered and requires profile verification.",
                        type: "alert" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
                    }
                );
            } else if (user.role === "Admin") {
                userNotifications.push(
                    {
                        userId: user._id,
                        title: "System Health Check",
                        message: "All systems are running normally. Database backup completed successfully.",
                        type: "alert" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                    },
                    {
                        userId: user._id,
                        title: "New User Registrations",
                        message: "3 new users registered today. Please review and approve their accounts.",
                        type: "alert" as const,
                        read: false,
                        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                    }
                );
            }

            notifications.push(...userNotifications);
        }

        // Insert all notifications
        await Notification.insertMany(notifications);

        // Count unread notifications per user
        for (const user of users) {
            const unreadCount = await Notification.countDocuments({
                userId: user._id,
                read: false,
            });
        }

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

seedNotifications();
