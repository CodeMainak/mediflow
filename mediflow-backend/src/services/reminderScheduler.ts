import cron from "node-cron";
import { Appointment } from "../models/Appointment";
import { User } from "../models/User";
import { sendCombinedReminder } from "./notificationService";

/**
 * Reminder Scheduler Service
 *
 * Automatically sends appointment reminders at scheduled intervals:
 * - 24 hours before appointment
 * - 1 hour before appointment
 */

// Track which appointments have been reminded to avoid duplicates
const remindedAppointments = new Set<string>();

/**
 * Send reminders for appointments happening in the next 24 hours
 */
const send24HourReminders = async () => {
    try {

        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

        // Find confirmed appointments happening in the next 24 hours
        const upcomingAppointments = await Appointment.find({
            status: "confirmed",
            date: {
                $gte: in23Hours,
                $lte: in24Hours,
            },
        })
            .populate("patientId", "name email phone")
            .populate("doctorId", "name email");


        for (const appointment of upcomingAppointments) {
            const reminderKey = `${appointment._id}-24h`;

            // Skip if already reminded
            if (remindedAppointments.has(reminderKey)) {
                continue;
            }

            const patient = appointment.patientId as any;
            const doctor = appointment.doctorId as any;

            if (patient && doctor) {
                await sendCombinedReminder(
                    patient.email,
                    patient.phone,
                    patient.name,
                    doctor.name,
                    appointment.date
                );

                // Mark as reminded
                remindedAppointments.add(reminderKey);
            }
        }
    } catch (error) {
    }
};

/**
 * Send reminders for appointments happening in the next 1 hour
 */
const send1HourReminders = async () => {
    try {

        const now = new Date();
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        const in50Minutes = new Date(now.getTime() + 50 * 60 * 1000);

        // Find confirmed appointments happening in the next hour
        const upcomingAppointments = await Appointment.find({
            status: "confirmed",
            date: {
                $gte: in50Minutes,
                $lte: in1Hour,
            },
        })
            .populate("patientId", "name email phone")
            .populate("doctorId", "name email");


        for (const appointment of upcomingAppointments) {
            const reminderKey = `${appointment._id}-1h`;

            // Skip if already reminded
            if (remindedAppointments.has(reminderKey)) {
                continue;
            }

            const patient = appointment.patientId as any;
            const doctor = appointment.doctorId as any;

            if (patient && doctor) {
                await sendCombinedReminder(
                    patient.email,
                    patient.phone,
                    patient.name,
                    doctor.name,
                    appointment.date
                );

                // Mark as reminded
                remindedAppointments.add(reminderKey);
            }
        }
    } catch (error) {
    }
};

/**
 * Clean up old reminder tracking data (run daily)
 */
const cleanupReminderTracking = () => {
    const size = remindedAppointments.size;
    remindedAppointments.clear();
};

/**
 * Initialize and start the reminder scheduler
 */
export const startReminderScheduler = () => {

    // Run 24-hour reminders every hour (to catch appointments within window)
    cron.schedule("0 * * * *", () => {
        send24HourReminders();
    });

    // Run 1-hour reminders every 10 minutes (more frequent for last-minute reminders)
    cron.schedule("*/10 * * * *", () => {
        send1HourReminders();
    });

    // Clean up reminder tracking daily at midnight
    cron.schedule("0 0 * * *", () => {
        cleanupReminderTracking();
    });

};

/**
 * Send immediate reminder for a specific appointment (manual trigger)
 */
export const sendImmediateReminder = async (appointmentId: string) => {
    try {
        const appointment = await Appointment.findById(appointmentId)
            .populate("patientId", "name email phone")
            .populate("doctorId", "name email");

        if (!appointment) {
            throw new Error("Appointment not found");
        }

        const patient = appointment.patientId as any;
        const doctor = appointment.doctorId as any;

        if (patient && doctor) {
            const result = await sendCombinedReminder(
                patient.email,
                patient.phone,
                patient.name,
                doctor.name,
                appointment.date
            );
            return result.emailSent || result.smsSent;
        }

        return false;
    } catch (error) {
        throw error;
    }
};
