import { Schema, model, Document, Types } from "mongoose";
import { IMedicine } from "./Medicine";
import { IUser } from "./User";

export type StockChangeType = "IN" | "OUT" | "ADJUSTMENT";

export interface IMedicineStockLog extends Document {
    medicineId: IMedicine["_id"];
    changeType: StockChangeType;
    quantity: number;           // always positive; direction determined by changeType
    quantityBefore: number;     // stock snapshot before this operation
    quantityAfter: number;      // stock snapshot after this operation
    reason: string;
    referenceId?: Types.ObjectId; // saleId or purchaseOrderId if applicable
    referenceType?: "Sale" | "PurchaseOrder" | "Manual";
    performedBy: IUser["_id"];
    createdAt: Date;
}

const medicineStockLogSchema = new Schema<IMedicineStockLog>(
    {
        medicineId: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: true,
            index: true,
        },
        changeType: {
            type: String,
            enum: ["IN", "OUT", "ADJUSTMENT"],
            required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        quantityBefore: { type: Number, required: true, min: 0 },
        quantityAfter: { type: Number, required: true, min: 0 },
        reason: { type: String, required: true, trim: true },
        referenceId: { type: Schema.Types.ObjectId },
        referenceType: {
            type: String,
            enum: ["Sale", "PurchaseOrder", "Manual"],
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // audit logs are immutable
    }
);

// Compound index for audit trail queries: all logs for a medicine in time order
medicineStockLogSchema.index({ medicineId: 1, createdAt: -1 });

// Index for querying logs by performer
medicineStockLogSchema.index({ performedBy: 1, createdAt: -1 });

export const MedicineStockLog = model<IMedicineStockLog>(
    "MedicineStockLog",
    medicineStockLogSchema
);
