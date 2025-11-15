import { Schema, model, Document } from "mongoose";

export interface IMessage extends Document {
    senderId: Schema.Types.ObjectId;
    receiverId: Schema.Types.ObjectId;
    content: string;
    isRead: boolean;
    attachments?: string[];
}

const messageSchema = new Schema<IMessage>(
    {
        senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        attachments: [{ type: String }], // URLs to uploaded files
    },
    { timestamps: true }
);

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);
