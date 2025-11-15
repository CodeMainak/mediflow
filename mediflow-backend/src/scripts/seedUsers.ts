import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const demoUsers = [
    {
        name: "Admin User",
        email: "admin@mediflow.com",
        password: "password123",
        role: "Admin" as const,
        phone: "+1-555-0001"
    },
    {
        name: "Dr. John Smith",
        email: "dr.smith@mediflow.com",
        password: "password123",
        role: "Doctor" as const,
        specialization: "Cardiology",
        phone: "+1-555-0002"
    },
    {
        name: "Jane Doe",
        email: "jane.doe@email.com",
        password: "password123",
        role: "Patient" as const,
        phone: "+1-555-0003",
        dateOfBirth: new Date("1990-05-15"),
        gender: "Female" as const
    },
    {
        name: "Lisa Wilson",
        email: "receptionist@mediflow.com",
        password: "password123",
        role: "Receptionist" as const,
        phone: "+1-555-0004"
    }
];

async function seedUsers() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env['MONGO_URI'] || "mongodb://localhost:27017/mediflow";
        await mongoose.connect(mongoUri);

        // Clear existing users (optional - comment out if you want to keep existing users)
        // await User.deleteMany({});

        // Create demo users
        for (const userData of demoUsers) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                continue;
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await User.create({
                ...userData,
                password: hashedPassword
            });
        }

        demoUsers.forEach(u => {
        });

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

seedUsers();
