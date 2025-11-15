import { Schema, model, Document } from "mongoose";

export interface IAppointment extends Document {
    patientId: Schema.Types.ObjectId;
    doctorId: Schema.Types.ObjectId;
    date: Date;
    time?: string;
    duration?: number;
    type?: "consultation" | "follow-up" | "emergency";
    reason?: string;
    status: "pending" | "approved" | "rejected" | "confirmed" | "cancelled" | "completed";
    notes?: string;
    checkInTime?: Date;
}

const appointmentSchema = new Schema<IAppointment>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: Date, required: true },
        time: { type: String },
        duration: { type: Number, default: 30 },
        type: { type: String, enum: ["consultation", "follow-up", "emergency"], default: "consultation" },
        reason: { type: String },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "confirmed", "cancelled", "completed"],
            default: "pending"
        },
        notes: { type: String },
        checkInTime: { type: Date },
    },
    { timestamps: true }
);

// Prevent double booking: Ensure doctor can't have multiple appointments at same date/time
// This compound index ensures uniqueness only for non-cancelled appointments
appointmentSchema.index(
    { doctorId: 1, date: 1, time: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $nin: ["cancelled", "rejected"] }
        }
    }
);

export const Appointment = model<IAppointment>("Appointment", appointmentSchema);
