import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";
import { IAppointment } from "./Appointment";

export interface IPrescription extends Document {
    appointment: IAppointment["_id"];
    doctor: IUser["_id"];
    patient: IUser["_id"];
    medicines: { name: string; dosage: string; duration: string }[];
    notes?: string;
    createdAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
    {
        appointment: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
        doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
        patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
        medicines: [
            {
                name: { type: String, required: true },
                dosage: { type: String, required: true },
                duration: { type: String, required: true },
            },
        ],
        notes: { type: String },
    },
    { timestamps: true }
);

export const Prescription = mongoose.model<IPrescription>("Prescription", prescriptionSchema);
