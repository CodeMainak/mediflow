import express from "express";
import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    rescheduleAppointment,
    deleteAppointment,
    checkInPatient,
    getAvailableSlots,
} from "../controllers/appointmentController";
import { protect, onlyRole } from "../middlewares/authMiddleware";

const router = express.Router();

// ✅ Order of middleware: protect → onlyRole → controller
// Patient and Receptionist can book appointments
router.post(
    "/",
    protect,
    onlyRole(["Patient", "Receptionist", 'Admin']),
    createAppointment
);

// Doctor, Receptionist, and Admin can approve/reject appointments
router.patch(
    "/:id/status",
    protect,
    onlyRole(["Doctor", "Receptionist", "Admin"]),
    updateAppointmentStatus
);

// Receptionist and Admin can check-in patients
router.patch(
    "/:id/checkin",
    protect,
    onlyRole(["Receptionist", "Admin"]),
    checkInPatient
);

// Reschedule appointment (Patient, Doctor, Receptionist, or Admin)
router.patch(
    "/:id/reschedule",
    protect,
    onlyRole(["Patient", "Doctor", "Receptionist", "Admin"]),
    rescheduleAppointment
);

// Delete/Cancel appointment (Patient, Doctor, Receptionist, or Admin)
router.delete(
    "/:id",
    protect,
    onlyRole(["Patient", "Doctor", "Receptionist", "Admin"]),
    deleteAppointment
);

// Check available time slots for a doctor on a specific date
// IMPORTANT: This must come BEFORE /:id route to avoid conflicts
router.get(
    "/available-slots",
    protect,
    onlyRole(["Patient", "Doctor", "Receptionist", "Admin"]),
    getAvailableSlots
);

// Patient, Doctor, Receptionist & Admin can view appointments
router.get(
    "/",
    protect,
    onlyRole(["Patient", "Doctor", "Receptionist", "Admin"]),
    getAppointments
);

// Patient, Doctor, Receptionist & Admin can view single appointment
router.get(
    "/:id",
    protect,
    onlyRole(["Patient", "Doctor", "Receptionist", "Admin"]),
    getAppointmentById
);

export default router;
