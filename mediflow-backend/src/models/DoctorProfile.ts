// src/models/DoctorProfile.ts
import { Schema, model, Document } from "mongoose";
import { IUser } from "./User";

export interface IDoctorProfile extends Document {
    user: IUser["_id"];
    specialization: string;
    experience: number; // years
    availability: {
        day: string; // e.g. "Monday"
        startTime: string; // e.g. "09:00"
        endTime: string;   // e.g. "12:00"
    }[];
}

const doctorProfileSchema = new Schema<IDoctorProfile>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        specialization: { type: String, required: true },
        experience: { type: Number, default: 0 },
        availability: [
            {
                day: { type: String, required: true },
                startTime: { type: String, required: true },
                endTime: { type: String, required: true },
            },
        ],
    },
    { timestamps: true }
);

export const DoctorProfile = model<IDoctorProfile>("DoctorProfile", doctorProfileSchema);
