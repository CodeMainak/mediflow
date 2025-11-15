import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";
import { IAppointment } from "./Appointment";
import { IPrescription } from "./Prescription";

export interface IMedicalRecord extends Document {
    patient: IUser["_id"];
    doctor: IUser["_id"];
    diagnosis: string;
    prescription: string;
    attachments: string[]; // URLs to uploaded files (test reports, scans, etc.)
    prescriptions?: IPrescription["_id"][];
    appointments?: IAppointment["_id"][];
    notes?: string;
    visitDate: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
    {
        patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
        doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
        diagnosis: { type: String, required: true },
        prescription: { type: String, required: true },
        attachments: [{ type: String }], // URLs to uploaded files
        prescriptions: [{ type: Schema.Types.ObjectId, ref: "Prescription" }],
        appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
        notes: { type: String },
        visitDate: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true }
);

// Index for faster patient queries
MedicalRecordSchema.index({ patient: 1, visitDate: -1 });

export const MedicalRecord = mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
