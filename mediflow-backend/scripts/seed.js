/**
 * Seed script - creates demo accounts + realistic sample data in local MongoDB
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
    dateOfBirth: Date,
    bloodGroup: String,
    allergies: [String],
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
    },
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    time: String,
    duration: { type: Number, default: 30 },
    type: { type: String, enum: ["consultation", "follow-up", "emergency"], default: "consultation" },
    reason: String,
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "confirmed", "cancelled", "completed"],
        default: "pending",
    },
    notes: String,
}, { timestamps: true });

const prescriptionSchema = new mongoose.Schema({
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicines: [{ name: String, dosage: String, duration: String }],
    notes: String,
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);
const Prescription = mongoose.model("Prescription", prescriptionSchema);
const Message = mongoose.model("Message", messageSchema);

const users = [
    { name: "Admin User",          email: "admin@mediflow.com",          password: "password123", role: "Admin" },
    { name: "Dr. John Smith",      email: "dr.smith@mediflow.com",        password: "password123", role: "Doctor",       specialization: "General Medicine" },
    { name: "Dr. Sarah Johnson",   email: "dr.johnson@mediflow.com",      password: "password123", role: "Doctor",       specialization: "Cardiology" },
    {
        name: "Jane Doe", email: "jane.doe@email.com", password: "password123", role: "Patient",
        phone: "+1-555-0142", gender: "Female", dateOfBirth: new Date("1994-03-18"),
        address: "221 Maple Street, Springfield", bloodGroup: "O+",
        allergies: ["Penicillin"],
        emergencyContact: { name: "Robert Doe", relationship: "Spouse", phone: "+1-555-0199" },
    },
    { name: "John Patient",        email: "patient@mediflow.com",         password: "password123", role: "Patient" },
    { name: "Receptionist Alice",  email: "receptionist@mediflow.com",    password: "password123", role: "Receptionist" },
    { name: "Pharmacist Bob",      email: "pharmacist@mediflow.com",      password: "password123", role: "Pharmacist" },
    { name: "Mainak Mondal",       email: "mainak.mondal33@gmail.com",    password: "Mainak@123",  role: "Admin" },
    { name: "Dr. Gourab Das",      email: "gourab.das@gmail.com",         password: "Mainak@123",  role: "Doctor",       specialization: "General Medicine" },
];

function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}

async function seedUsers() {
    let created = 0, skipped = 0;
    for (const u of users) {
        const exists = await User.findOne({ email: u.email });
        if (exists) {
            // Backfill profile fields on pre-existing demo accounts (created
            // before this script seeded them) without touching password/role.
            const { password, ...profileFields } = u;
            const isEmpty = (v) => v == null || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v.toObject ? v.toObject() : v).length === 0);
            const missingFields = Object.fromEntries(
                Object.entries(profileFields).filter(([key]) => isEmpty(exists[key]))
            );
            if (Object.keys(missingFields).length > 0) {
                await User.updateOne({ _id: exists._id }, { $set: missingFields });
                console.log(`  updated ${u.email} (backfilled ${Object.keys(missingFields).join(', ')})`);
            } else {
                console.log(`  skip  ${u.email} (already exists)`);
            }
            skipped++;
            continue;
        }
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({ ...u, password: hashed });
        console.log(`  created [${u.role.padEnd(12)}] ${u.email}`);
        created++;
    }
    console.log(`\nUsers: ${created} created, ${skipped} skipped.`);
}

async function seedSampleData() {
    const jane = await User.findOne({ email: "jane.doe@email.com" });
    const drJohnson = await User.findOne({ email: "dr.johnson@mediflow.com" });
    const drSmith = await User.findOne({ email: "dr.smith@mediflow.com" });
    const drGourab = await User.findOne({ email: "gourab.das@gmail.com" });
    if (!jane || !drJohnson || !drSmith) {
        console.log("Skipping sample data — expected demo users not found.");
        return;
    }

    const existingAppointments = await Appointment.countDocuments({ patientId: jane._id });
    if (existingAppointments > 0) {
        console.log(`Skipping sample appointments/prescriptions/messages — Jane Doe already has ${existingAppointments}.`);
        return;
    }

    // Past, completed appointment with a prescription attached
    const pastCardiology = await Appointment.create({
        patientId: jane._id, doctorId: drJohnson._id, date: daysFromNow(-14), time: "10:30",
        type: "consultation", reason: "Routine cardiology checkup", status: "completed",
        notes: "Blood pressure within normal range. Continue current medication.",
    });
    await Prescription.create({
        appointment: pastCardiology._id, doctor: drJohnson._id, patient: jane._id,
        medicines: [
            { name: "Atorvastatin", dosage: "10mg, once daily", duration: "90 days" },
            { name: "Aspirin", dosage: "75mg, once daily", duration: "90 days" },
        ],
        notes: "Recheck lipid panel in 3 months.",
    });

    const pastGeneral = await Appointment.create({
        patientId: jane._id, doctorId: drSmith._id, date: daysFromNow(-30), time: "14:00",
        type: "consultation", reason: "Annual physical", status: "completed",
        notes: "General health good. Recommended vitamin D supplement.",
    });
    await Prescription.create({
        appointment: pastGeneral._id, doctor: drSmith._id, patient: jane._id,
        medicines: [{ name: "Vitamin D3", dosage: "1000 IU, once daily", duration: "60 days" }],
        notes: "Follow up if fatigue persists.",
    });

    // Upcoming, confirmed appointment
    await Appointment.create({
        patientId: jane._id, doctorId: drJohnson._id, date: daysFromNow(5), time: "11:00",
        type: "follow-up", reason: "Cardiology follow-up", status: "confirmed",
    });

    console.log("Created 3 sample appointments and 2 sample prescriptions for Jane Doe.");

    if (drGourab) {
        await Message.create([
            {
                senderId: jane._id, receiverId: drGourab._id,
                content: "Hi Dr. Das, I still have some mild dizziness after the medication change. Should I be concerned?",
                isRead: true,
            },
            {
                senderId: drGourab._id, receiverId: jane._id,
                content: "Thanks for flagging it — mild dizziness in the first week is common while your body adjusts. Let me know if it's still happening after this week or if it gets worse.",
                isRead: false,
            },
        ]);
        console.log("Created a sample message thread between Jane Doe and Dr. Gourab Das.");
    }
}

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    await seedUsers();
    await seedSampleData();

    console.log("\nDemo accounts:");
    console.log("  admin@mediflow.com          / password123  (Admin)");
    console.log("  dr.smith@mediflow.com        / password123  (Doctor)");
    console.log("  jane.doe@email.com           / password123  (Patient — has sample appointments/prescriptions/messages)");
    console.log("  receptionist@mediflow.com    / password123  (Receptionist)");
    console.log("  pharmacist@mediflow.com      / password123  (Pharmacist)");
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
