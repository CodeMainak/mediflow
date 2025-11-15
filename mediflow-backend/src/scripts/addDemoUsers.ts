// Script to add demo users to the database
// Run with: npx ts-node src/scripts/addDemoUsers.ts

import mongoose from "mongoose";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mediflow";

const demoUsers = [
    {
        name: "Admin User",
        email: "admin@mediflow.com",
        password: "password123",
        role: "Admin",
        phone: "+1-555-0001",
    },
    {
        name: "Mainak Mondal",
        email: "mainak.mondal33@gmail.com",
        password: "Mainak@123",
        role: "Patient",
        specialization: "Cardiology",
        phone: "+1-555-0002",
    },
    {
        name: "Gourab Das",
        email: "gourab.das@gmail.com",
        password: "Mainak@123",
        role: "Doctor",
        phone: "8436417132",
        dateOfBirth: new Date("1996-2-15"),
        gender: "Male",
    },
    {
        name: "Lisa Wilson",
        email: "receptionist@mediflow.com",
        password: "password123",
        role: "Receptionist",
        phone: "+1-555-0004",
    },
];

async function addDemoUsers() {
    try {
        await mongoose.connect(MONGO_URI);


        for (const userData of demoUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });

            if (existingUser) {
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user
            const user = await User.create({
                ...userData,
                password: hashedPassword,
            });

        }

        demoUsers.forEach((user) => {
        });

        await mongoose.connection.close();
    } catch (error) {
        process.exit(1);
    }
}

addDemoUsers();
