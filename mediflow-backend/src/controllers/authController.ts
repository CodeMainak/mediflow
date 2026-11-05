import { Request, Response } from "express"; // If you switch to ESM
import { User } from "../models/User";
import { AuthRequest } from "../middlewares/authMiddleware";
// OR use const { Request, Response } = require("express"); for CommonJS
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


interface SignupRequest extends Request {
    body: {
        name: string;
        email: string;
        password: string;
    };
}

interface LoginRequest extends Request {
    body: {
        email: string;
        password: string;
    };
}

export const signup = async (req: SignupRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        // Typed checks also stop query objects such as { "$ne": null } reaching Mongo.
        if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
            res.status(400).json({ msg: "Please provide a valid name and email." });
            return;
        }
        if (typeof password !== "string" || password.length < 8) {
            res.status(400).json({ msg: "Password must be at least 8 characters." });
            return;
        }

        const existing = await User.findOne({ email });
        if (existing) {
            res.status(400).json({ msg: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Self-signup is always a patient. Staff accounts are created by an admin;
        // a role in the request body is ignored, or anyone could register as Admin.
        const user = await User.create({ name, email, password: hashedPassword, role: "Patient" });

        res.status(201).json({
            msg: "User created",
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message }); // return readable error
    }
};

export const login = async (req: LoginRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string") {
            res.status(400).json({ msg: "Invalid credentials" });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ msg: "Invalid credentials" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ msg: "Invalid credentials" });
            return;
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env["JWT_SECRET"],
            { algorithm: "HS256", expiresIn: "1d" }
        );

        // Return user object without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            specialization: user.specialization,
            phone: user.phone,
            address: user.address,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            profileImage: user.profileImage
        };

        res.json({ token, user: userResponse });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message }); // return readable error
    }
};

// Get current logged-in user
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // User is already attached by protect middleware
        const user = req.user;

        if (!user) {
            res.status(401).json({ msg: "Not authorized" });
            return;
        }

        res.json(user);
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({ msg: "Not authorized" });
            return;
        }

        const {
            name,
            phone,
            address,
            dateOfBirth,
            gender,
            bloodGroup,
            allergies,
            emergencyContact
        } = req.body;

        // Validate blood group if provided
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (bloodGroup && !validBloodGroups.includes(bloodGroup)) {
            res.status(400).json({ msg: "Invalid blood group. Must be one of: " + validBloodGroups.join(', ') });
            return;
        }

        // Update user fields
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(address && { address }),
                ...(dateOfBirth && { dateOfBirth }),
                ...(gender && { gender }),
                ...(bloodGroup !== undefined && { bloodGroup }),
                ...(allergies !== undefined && { allergies }),
                ...(emergencyContact !== undefined && { emergencyContact })
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404).json({ msg: "User not found" });
            return;
        }

        res.json({ msg: "Profile updated successfully", user: updatedUser });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};
