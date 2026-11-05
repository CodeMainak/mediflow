import { Schema, model, Document } from "mongoose";

export type PrescriptionStatus = "uploaded" | "extracted" | "needs_manual" | "verified";

/**
 * One run through the prescription assistant. The original filename is
 * deliberately not stored, because filenames often contain a patient's name.
 */
export interface IPrescriptionUpload extends Document {
    patient: Schema.Types.ObjectId;
    mimeType: string;
    sizeBytes: number;
    contentHash?: string;
    consentVersion: string;
    consentedAt: Date;
    status: PrescriptionStatus;
    extractionStartedAt: Date | null;
    extractionFailure: string | null;
    extraction: unknown;
    verified: { medications: { name: string }[]; findings: string[] } | null;
    navigation: unknown;
    fileExpiresAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
}

const prescriptionUploadSchema = new Schema<IPrescriptionUpload>(
    {
        patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        contentHash: { type: String },
        consentVersion: { type: String, required: true },
        consentedAt: { type: Date, required: true },
        status: { type: String, enum: ["uploaded", "extracted", "needs_manual", "verified"], default: "uploaded" },
        extractionStartedAt: { type: Date, default: null },
        extractionFailure: { type: String, default: null },
        extraction: { type: Schema.Types.Mixed, default: null },
        verified: { type: Schema.Types.Mixed, default: null },
        navigation: { type: Schema.Types.Mixed, default: null },
        fileExpiresAt: { type: Date, default: null },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

prescriptionUploadSchema.index({ patient: 1, createdAt: -1 });
prescriptionUploadSchema.index({ patient: 1, contentHash: 1 });
prescriptionUploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PrescriptionUpload = model<IPrescriptionUpload>("PrescriptionUpload", prescriptionUploadSchema);
