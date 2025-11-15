// src/controllers/doctorController.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { DoctorProfile } from "../models/DoctorProfile";
import { IUser } from "../models/User";

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
        const doctorProfiles = await DoctorProfile.find().populate("user", "-password");

        // If no profiles exist, fallback to getting users with Doctor role
        if (doctorProfiles.length === 0) {
            const { User } = require("../models/User");
            const doctors = await User.find({ role: "Doctor" }).select("-password");
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
        const doctors = await DoctorProfile.find({ specialization }).populate("user", "-password");
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ msg: "Server error", err });
    }
};
