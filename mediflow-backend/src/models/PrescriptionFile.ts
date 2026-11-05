import { Schema, model, Document } from "mongoose";

/**
 * The uploaded prescription's bytes, kept apart from its metadata so that
 * listing uploads never loads files. There's no public URL: the only way out
 * is the owner-checked route. The TTL index removes files nobody finished with.
 */
export interface IPrescriptionFile extends Document {
    upload: Schema.Types.ObjectId;
    patient: Schema.Types.ObjectId;
    data: Buffer;
    mimeType: string;
    expiresAt: Date;
}

const prescriptionFileSchema = new Schema<IPrescriptionFile>({
    upload: { type: Schema.Types.ObjectId, ref: "PrescriptionUpload", required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    data: { type: Buffer, required: true },
    mimeType: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

prescriptionFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PrescriptionFile = model<IPrescriptionFile>("PrescriptionFile", prescriptionFileSchema);
