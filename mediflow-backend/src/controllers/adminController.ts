import { Request, Response } from "express";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { MedicalRecord } from "../models/MedicalRecord";
import { Prescription } from "../models/Prescription";
import bcrypt from "bcryptjs";

// Get all users with filtering and pagination
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;

        const query: any = {};

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            message: "Users retrieved successfully",
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve users" });
    }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "User retrieved successfully",
            data: user,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve user" });
    }
};

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role, specialization, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User with this email already exists" });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            specialization,
            phone,
            address,
        });

        const userResponse = await User.findById(user._id).select("-password");

        res.status(201).json({
            message: "User created successfully",
            data: userResponse,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to create user" });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        // Don't allow password update through this endpoint
        delete updates.password;

        const user = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user" });
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user" });
    }
};

// Get system statistics
export const getSystemStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Count users by role
        const totalPatients = await User.countDocuments({ role: "Patient" });
        const totalDoctors = await User.countDocuments({ role: "Doctor" });
        const totalReceptionists = await User.countDocuments({ role: "Receptionist" });
        const totalAdmins = await User.countDocuments({ role: "Admin" });

        // Count appointments by status
        const totalAppointments = await Appointment.countDocuments();
        const pendingAppointments = await Appointment.countDocuments({ status: "pending" });
        const approvedAppointments = await Appointment.countDocuments({ status: "approved" });
        const rejectedAppointments = await Appointment.countDocuments({ status: "rejected" });

        // Other stats
        const totalMedicalRecords = await MedicalRecord.countDocuments();
        const totalPrescriptions = await Prescription.countDocuments();

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsersLast30Days = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
        });

        const appointmentsLast30Days = await Appointment.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
        });

        res.status(200).json({
            message: "System statistics retrieved successfully",
            data: {
                users: {
                    total: totalPatients + totalDoctors + totalReceptionists + totalAdmins,
                    patients: totalPatients,
                    doctors: totalDoctors,
                    receptionists: totalReceptionists,
                    admins: totalAdmins,
                    newLast30Days: newUsersLast30Days,
                },
                appointments: {
                    total: totalAppointments,
                    pending: pendingAppointments,
                    approved: approvedAppointments,
                    rejected: rejectedAppointments,
                    last30Days: appointmentsLast30Days,
                },
                medicalRecords: {
                    total: totalMedicalRecords,
                },
                prescriptions: {
                    total: totalPrescriptions,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve system statistics" });
    }
};

// Get recent activity log
export const getActivityLog = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = 20 } = req.query;

        // Get recent appointments with user details
        const recentAppointments = await Appointment.find()
            .populate("patientId", "name email")
            .populate("doctorId", "name email specialization")
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        // Get recent users
        const recentUsers = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.status(200).json({
            message: "Activity log retrieved successfully",
            data: {
                recentAppointments,
                recentUsers,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve activity log" });
    }
};
