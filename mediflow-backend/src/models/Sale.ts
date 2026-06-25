import { Schema, model, Document, Types } from "mongoose";
import { IMedicine } from "./Medicine";
import { IUser } from "./User";
import { IPrescription } from "./Prescription";

export type PaymentMode = "cash" | "card" | "upi";

export interface ISaleItem {
    medicineId: IMedicine["_id"];
    medicineName: string;   // denormalized snapshot at time of sale
    quantity: number;
    unitPrice: number;      // price at time of sale (snapshot)
    subtotal: number;       // quantity * unitPrice
}

export interface ISale extends Document {
    medicines: ISaleItem[];
    patientId: IUser["_id"];
    prescriptionId: IPrescription["_id"]; // required — sale must be prescription-linked
    totalAmount: number;
    discount: number;       // percentage 0-100
    finalAmount: number;    // totalAmount after discount
    paymentMode: PaymentMode;
    paymentStatus: "paid" | "pending" | "refunded";
    soldBy: IUser["_id"];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
    {
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: true,
        },
        medicineName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const saleSchema = new Schema<ISale>(
    {
        medicines: {
            type: [saleItemSchema],
            required: true,
            validate: {
                validator: (arr: ISaleItem[]) => arr.length > 0,
                message: "A sale must contain at least one medicine",
            },
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        prescriptionId: {
            type: Schema.Types.ObjectId,
            ref: "Prescription",
            required: true,
            index: true,
        },
        totalAmount: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0, max: 100 },
        finalAmount: { type: Number, required: true, min: 0 },
        paymentMode: {
            type: String,
            enum: ["cash", "card", "upi"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["paid", "pending", "refunded"],
            default: "paid",
        },
        soldBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        notes: { type: String },
    },
    { timestamps: true }
);

// Index for date-range queries (reports/analytics)
saleSchema.index({ createdAt: -1 });

// Compound index for daily/monthly summaries
saleSchema.index({ createdAt: -1, soldBy: 1 });

export const Sale = model<ISale>("Sale", saleSchema);
