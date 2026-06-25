/**
 * Seed script - creates demo accounts in local MongoDB
 * Run: node scripts/seed.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mediflow";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    specialization: String,
    phone: String,
    address: String,
    gender: String,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

const users = [
    { name: "Admin User",          email: "admin@mediflow.com",          password: "password123", role: "Admin" },
    { name: "Dr. John Smith",      email: "dr.smith@mediflow.com",        password: "password123", role: "Doctor",       specialization: "General Medicine" },
    { name: "Dr. Sarah Johnson",   email: "dr.johnson@mediflow.com",      password: "password123", role: "Doctor",       specialization: "Cardiology" },
    { name: "Jane Doe",            email: "jane.doe@email.com",           password: "password123", role: "Patient" },
    { name: "John Patient",        email: "patient@mediflow.com",         password: "password123", role: "Patient" },
    { name: "Receptionist Alice",  email: "receptionist@mediflow.com",    password: "password123", role: "Receptionist" },
    { name: "Pharmacist Bob",      email: "pharmacist@mediflow.com",      password: "password123", role: "Pharmacist" },
    { name: "Mainak Mondal",       email: "mainak.mondal33@gmail.com",    password: "Mainak@123",  role: "Admin" },
    { name: "Dr. Gourab Das",      email: "gourab.das@gmail.com",         password: "Mainak@123",  role: "Doctor",       specialization: "General Medicine" },
];

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    let created = 0, skipped = 0;
    for (const u of users) {
        const exists = await User.findOne({ email: u.email });
        if (exists) { console.log(`  skip  ${u.email} (already exists)`); skipped++; continue; }
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({ ...u, password: hashed });
        console.log(`  created [${u.role.padEnd(12)}] ${u.email}`);
        created++;
    }

    console.log(`\nDone: ${created} created, ${skipped} skipped.`);
    console.log("\nDemo accounts:");
    console.log("  admin@mediflow.com          / password123  (Admin)");
    console.log("  dr.smith@mediflow.com        / password123  (Doctor)");
    console.log("  jane.doe@email.com           / password123  (Patient)");
    console.log("  receptionist@mediflow.com    / password123  (Receptionist)");
    console.log("  pharmacist@mediflow.com      / password123  (Pharmacist)");
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
