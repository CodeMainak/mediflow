import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "Doctor" | "Patient" | "Receptionist" | "Admin";
    specialization?: string; // For doctors
    phone?: string;
    address?: string;
    dateOfBirth?: Date;
    gender?: "Male" | "Female" | "Other";
    profileImage?: string;
    // Health Profile fields (for patients)
    bloodGroup?: string;
    allergies?: string[];
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
    };
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["Doctor", "Patient", "Receptionist", "Admin"],
            required: true,
        },
        specialization: { type: String }, // For doctors
        phone: { type: String },
        address: { type: String },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ["Male", "Female", "Other"] },
        profileImage: { type: String },
        // Health Profile fields (for patients)
        bloodGroup: { type: String },
        allergies: [{ type: String }],
        emergencyContact: {
            name: { type: String },
            relationship: { type: String },
            phone: { type: String },
        },
    },
    { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
