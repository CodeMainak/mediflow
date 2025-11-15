// Script to add a test doctor to the database
// Run with: npx ts-node src/scripts/addTestDoctor.ts

import mongoose from "mongoose";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mediflow";

async function addTestDoctor() {
    try {
        await mongoose.connect(MONGO_URI);

        // Check if doctor already exists
        const existingDoctor = await User.findOne({ email: "dr.smith@hospital.com" });

        if (existingDoctor) {
            await mongoose.connection.close();
            return;
        }

        // Create test doctor
        const hashedPassword = await bcrypt.hash("password123", 10);

        const doctor = await User.create({
            name: "Dr. John Smith",
            email: "dr.smith@hospital.com",
            password: hashedPassword,
            role: "Doctor",
            specialization: "Cardiology",
            phone: "+1-555-0123",
            address: "123 Medical Center Dr, Healthcare City"
        });


        await mongoose.connection.close();
    } catch (error) {
        process.exit(1);
    }
}

addTestDoctor();
