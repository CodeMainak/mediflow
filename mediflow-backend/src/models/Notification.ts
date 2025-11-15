import { Schema, model, Document } from "mongoose";

export interface INotification extends Document {
    userId: Schema.Types.ObjectId;
    title: string;
    message: string;
    type: "appointment" | "prescription" | "reminder" | "alert";
    read: boolean;
    relatedId?: Schema.Types.ObjectId; // ID of related appointment/prescription/etc
    relatedModel?: string; // Model name (Appointment, Prescription, etc)
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ["appointment", "prescription", "reminder", "alert"],
            required: true,
        },
        read: { type: Boolean, default: false },
        relatedId: { type: Schema.Types.ObjectId },
        relatedModel: { type: String },
    },
    { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);
