import { Response } from "express";
import { Prescription } from "../models/Prescription";
import { MedicalRecord } from "../models/MedicalRecord";
import { AuthRequest } from "../middlewares/authMiddleware";

export const createPrescription = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { appointment, patient, medicines, notes } = req.body;

        if (!req.user || req.user.role !== "Doctor") {
            return res.status(403).json({ msg: "Doctors only" });
        }

        const prescription = await Prescription.create({
            appointment,
            doctor: req.user._id,
            patient,
            medicines,
            notes,
        });

        await MedicalRecord.findOneAndUpdate(
            { patient },
            { $push: { prescriptions: prescription._id } },
            { upsert: false, new: true }
        );

        return res.status(201).json(prescription);
    } catch (err) {
        return res.status(500).json({ msg: "Error creating prescription", error: err });
    }
};

export const getPatientPrescriptions = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        if (req.user.role === "Patient" && req.user._id.toString() !== id) {
            return res.status(403).json({ msg: "Patients can only view their own prescriptions" });
        }

        const prescriptions = await Prescription.find({ patient: id })
            .populate("doctor", "name email")
            .populate("appointment", "date status");

        return res.json(prescriptions);
    } catch (err) {
        return res.status(500).json({ msg: "Error fetching prescriptions", error: err });
    }
};

// Get all prescriptions for current user (role-based)
export const getMyPrescriptions = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        let prescriptions;

        if (req.user.role === "Doctor") {
            // Doctors see prescriptions they created
            prescriptions = await Prescription.find({ doctor: req.user._id })
                .populate("doctor", "name email specialization")
                .populate("patient", "name email phone")
                .populate("appointment", "date status")
                .sort({ createdAt: -1 });
        } else if (req.user.role === "Patient") {
            // Patients see their own prescriptions
            prescriptions = await Prescription.find({ patient: req.user._id })
                .populate("doctor", "name email specialization")
                .populate("appointment", "date status")
                .sort({ createdAt: -1 });
        } else {
            return res.status(403).json({ msg: "Access denied" });
        }

        return res.json(prescriptions);
    } catch (err) {
        return res.status(500).json({ msg: "Error fetching prescriptions", error: err });
    }
};

// Update prescription (Doctor only)
export const updatePrescription = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { medicines, notes } = req.body;

        if (!req.user || req.user.role !== "Doctor") {
            return res.status(403).json({ msg: "Doctors only" });
        }

        // Find prescription and verify ownership
        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ msg: "Prescription not found" });
        }

        // Verify doctor ownership
        const doctorId = (prescription.doctor as any)?._id || prescription.doctor;
        if (doctorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "You can only edit your own prescriptions" });
        }

        // Update prescription
        prescription.medicines = medicines;
        prescription.notes = notes;
        await prescription.save();

        // Populate before returning
        const updatedPrescription = await Prescription.findById(id)
            .populate("doctor", "name email specialization")
            .populate("patient", "name email phone")
            .populate("appointment", "date status");

        return res.json(updatedPrescription);
    } catch (err) {
        return res.status(500).json({ msg: "Error updating prescription", error: err });
    }
};
