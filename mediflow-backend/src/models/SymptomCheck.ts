import { Schema, model, Document } from "mongoose";

export interface ISymptomCheck extends Document {
    patient: Schema.Types.ObjectId;
    symptoms: string;
    specialization: string;
    urgency: "low" | "medium" | "high" | "emergency";
    reasoning: string;
    selfCare: string;
    mode: "ai" | "fallback";
    createdAt: Date;
}

const symptomCheckSchema = new Schema<ISymptomCheck>(
    {
        patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
        symptoms: { type: String, required: true },
        specialization: { type: String, required: true },
        urgency: { type: String, enum: ["low", "medium", "high", "emergency"], required: true },
        reasoning: { type: String, required: true },
        selfCare: { type: String, required: true },
        mode: { type: String, enum: ["ai", "fallback"], required: true },
    },
    { timestamps: true }
);

symptomCheckSchema.index({ patient: 1, createdAt: -1 });

export const SymptomCheck = model<ISymptomCheck>("SymptomCheck", symptomCheckSchema);
