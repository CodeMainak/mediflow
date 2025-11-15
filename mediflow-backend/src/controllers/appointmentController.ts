import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Appointment, IAppointment } from "../models/Appointment";
import { IUser, User } from "../models/User";
import {
    sendAppointmentConfirmation,
    sendAppointmentRejection,
} from "../services/notificationService";

// ✅ Patient books appointment
export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { doctorId, date, time, duration, type, reason, notes } = req.body;
        const user = req.user as IUser;

        // Pre-check: Verify slot is available (better UX - fail fast)
        const existingAppointment = await Appointment.findOne({
            doctorId,
            date: new Date(date),
            time,
            status: { $nin: ["cancelled", "rejected"] }
        });

        if (existingAppointment) {
            res.status(409).json({
                msg: "This time slot is already booked. Please select another time.",
                conflictingAppointment: existingAppointment
            });
            return;
        }

        // Attempt to create appointment
        const appointment = await Appointment.create({
            patientId: user._id,
            doctorId,
            date,
            time,
            duration,
            type,
            reason,
            notes
        });

        res.status(201).json(appointment);
    } catch (err: any) {

        // Handle duplicate key error (race condition caught by database)
        if (err.code === 11000) {
            res.status(409).json({
                msg: "This time slot was just booked by another patient. Please select another time.",
                error: "Slot unavailable"
            });
            return;
        }

        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// ✅ Doctor approves/rejects appointment
export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            req.params['id'],
            { status },
            { new: true }
        ).populate("patientId doctorId");

        if (!appointment) {
            res.status(404).json({ msg: "Appointment not found" });
            return;
        }

        // Send notification email
        const patient = appointment.patientId as any;
        const doctor = appointment.doctorId as any;

        if (status === "approved") {
            await sendAppointmentConfirmation(
                patient.email,
                patient.name,
                doctor.name,
                appointment.date
            );
        } else if (status === "rejected") {
            await sendAppointmentRejection(
                patient.email,
                patient.name,
                doctor.name,
                appointment.date,
                appointment.notes
            );
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// ✅ Check-in patient for appointment
export const checkInPatient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { checkInTime } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            req.params['id'],
            { checkInTime: checkInTime || new Date() },
            { new: true }
        ).populate("patientId doctorId");

        if (!appointment) {
            res.status(404).json({ msg: "Appointment not found" });
            return;
        }

        // Verify the appointment is confirmed
        if (appointment.status !== "confirmed") {
            res.status(400).json({ msg: "Only confirmed appointments can be checked in" });
            return;
        }

        res.json({ msg: "Patient checked in successfully", appointment });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// ✅ Get appointments for logged-in user
export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;
        let query: Record<string, unknown> = {};

        if (user.role === "Patient") query = { patientId: user._id };
        else if (user.role === "Doctor") query = { doctorId: user._id };

        const appointments: IAppointment[] = await Appointment.find(query)
            .populate("patientId", "name email phone")
            .populate("doctorId", "name email specialization role");
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// ✅ Get single appointment
export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const appointment = await Appointment.findById(req.params["id"])
            .populate("patientId", "name email phone")
            .populate("doctorId", "name email specialization");

        if (!appointment) {
            res.status(404).json({ msg: "Appointment not found" });
            return;
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// ✅ Reschedule appointment
export const rescheduleAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { newDate } = req.body;
        const user = req.user as IUser;

        const appointment = await Appointment.findById(req.params["id"])
            .populate("patientId doctorId");

        if (!appointment) {
            res.status(404).json({ msg: "Appointment not found" });
            return;
        }

        // Check authorization - only patient or doctor can reschedule
        const patientId = (appointment.patientId as any)._id.toString();
        const doctorId = (appointment.doctorId as any)._id.toString();

        if ((user._id as any).toString() !== patientId && (user._id as any).toString() !== doctorId) {
            res.status(403).json({ msg: "Not authorized to reschedule this appointment" });
            return;
        }

        // Update appointment date and reset status to pending
        appointment.date = new Date(newDate);
        appointment.status = "pending";
        await appointment.save();

        const patient = appointment.patientId as any;
        const doctor = appointment.doctorId as any;

        // Send notification to both parties
        await sendAppointmentConfirmation(
            patient.email,
            patient.name,
            doctor.name,
            appointment.date
        );

        res.json({
            msg: "Appointment rescheduled successfully",
            appointment,
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// ✅ Delete/Cancel appointment
export const deleteAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user as IUser;

        const appointment = await Appointment.findById(req.params["id"]);

        if (!appointment) {
            res.status(404).json({ msg: "Appointment not found" });
            return;
        }

        // Check authorization
        if (
            (user._id as any).toString() !== appointment.patientId.toString() &&
            (user._id as any).toString() !== appointment.doctorId.toString()
        ) {
            res.status(403).json({ msg: "Not authorized to delete this appointment" });
            return;
        }

        await Appointment.findByIdAndDelete(req.params["id"]);

        res.json({ msg: "Appointment deleted successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// ✅ Get available time slots for a doctor on a specific date
export const getAvailableSlots = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            res.status(400).json({ msg: "doctorId and date are required" });
            return;
        }

        // Get all booked appointments for this doctor on this date
        const bookedAppointments = await Appointment.find({
            doctorId,
            date: new Date(date as string),
            status: { $nin: ["cancelled", "rejected"] }
        }).select("time");

        const bookedTimes = bookedAppointments.map(apt => apt.time);

        // Generate all possible time slots (9 AM to 5 PM, 30-minute intervals)
        const allSlots = [];
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                allSlots.push(time);
            }
        }

        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

        res.json({
            date,
            doctorId,
            availableSlots,
            bookedSlots: bookedTimes
        });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};
