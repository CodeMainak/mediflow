// src/controllers/doctorController.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { DoctorProfile } from "../models/DoctorProfile";
import { IUser, User } from "../models/User";

// What any signed-in user may see about a doctor. Not their address, date of birth or phone.
const PUBLIC_DOCTOR_FIELDS = "name email specialization profileImage";

// The triage and prescription flows say "General Physician"; seeded doctors say "General Medicine".
const SPECIALIZATION_ALIASES: Record<string, string[]> = {
    "general physician": ["General Physician", "General Medicine"],
};

// Create or update doctor profile
export const upsertDoctorProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user as IUser;
        const { specialization, experience, availability } = req.body;

        let profile = await DoctorProfile.findOneAndUpdate(
            { user: user._id },
            { specialization, experience, availability },
            { new: true, upsert: true }
        );

        res.json(profile);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// Get all doctors
export const getDoctors = async (_req: AuthRequest, res: Response) => {
    try {
        // First try to get from DoctorProfiles
        const doctorProfiles = await DoctorProfile.find().populate("user", PUBLIC_DOCTOR_FIELDS);

        // If no profiles exist, fallback to getting users with Doctor role
        if (doctorProfiles.length === 0) {
            const doctors = await User.find({ role: "Doctor" }).select(PUBLIC_DOCTOR_FIELDS);
            res.json(doctors);
        } else {
            res.json(doctorProfiles);
        }
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};

// Search doctors by specialization
export const searchDoctors = async (req: AuthRequest, res: Response) => {
    try {
        const { specialization } = req.query;
        if (typeof specialization !== "string" || !specialization.trim() || specialization.length > 60) {
            res.status(400).json({ msg: "Please provide a specialization." });
            return;
        }

        const names = SPECIALIZATION_ALIASES[specialization.trim().toLowerCase()] ?? [specialization.trim()];
        const matches = names.map((n) => new RegExp(`^${n.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&")}$`, "i"));

        // Doctors can have a specialization on a profile, on their user, or both.
        const profiles = await DoctorProfile.find({ specialization: { $in: matches } }).populate("user", PUBLIC_DOCTOR_FIELDS);
        const users = await User.find({ role: "Doctor", specialization: { $in: matches } }).select(PUBLIC_DOCTOR_FIELDS);

        const byUser = new Map<string, { _id: unknown; name: string; specialization: string; experience?: number }>();
        for (const u of users) {
            byUser.set(String(u._id), { _id: u._id, name: u.name, specialization: (u as any).specialization });
        }
        for (const p of profiles) {
            const u = p.user as any;
            if (u?._id) byUser.set(String(u._id), { _id: u._id, name: u.name, specialization: p.specialization, experience: p.experience });
        }
        res.json([...byUser.values()]);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};
