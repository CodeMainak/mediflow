import { Schema, model, Document, Types } from "mongoose";

export interface ISupplier {
    name: string;
    contactPhone?: string;
    email?: string;
    address?: string;
}

export interface IMedicine extends Document {
    name: string;
    brand: string;
    genericName?: string;
    category?: string;
    batchNumber: string;
    expiryDate: Date;
    unitPrice: number;
    stockQuantity: number;
    reorderLevel: number;
    supplier: ISupplier;
    unit: string; // e.g. "tablet", "ml", "capsule"
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
    {
        name: { type: String, required: true },
        contactPhone: { type: String },
        email: { type: String },
        address: { type: String },
    },
    { _id: false }
);

const medicineSchema = new Schema<IMedicine>(
    {
        name: { type: String, required: true, trim: true },
        brand: { type: String, required: true, trim: true },
        genericName: { type: String, trim: true },
        category: { type: String, trim: true }, // e.g. "Antibiotic", "Analgesic"
        batchNumber: { type: String, required: true, trim: true },
        expiryDate: { type: Date, required: true },
        unitPrice: { type: Number, required: true, min: 0 },
        stockQuantity: { type: Number, required: true, min: 0, default: 0 },
        reorderLevel: { type: Number, required: true, min: 0, default: 10 },
        supplier: { type: supplierSchema, required: true },
        unit: { type: String, required: true, default: "tablet" },
        description: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Compound index to prevent duplicate (name + brand + batchNumber) combinations
medicineSchema.index({ name: 1, brand: 1, batchNumber: 1 }, { unique: true });

// Index for fast expiry date queries
medicineSchema.index({ expiryDate: 1 });

// Index for low-stock queries
medicineSchema.index({ stockQuantity: 1, reorderLevel: 1 });

// Text index for search
medicineSchema.index({ name: "text", brand: "text", genericName: "text" });

export const Medicine = model<IMedicine>("Medicine", medicineSchema);
