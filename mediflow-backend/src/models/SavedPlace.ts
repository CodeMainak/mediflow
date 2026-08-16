import { Schema, model, Document } from "mongoose";

export interface ISavedPlace extends Document {
    patient: Schema.Types.ObjectId;
    name: string;
    type: string;
    address?: string;
    rating?: number;
    userRatingsTotal?: number;
    mapsUrl: string;
    createdAt: Date;
}

const savedPlaceSchema = new Schema<ISavedPlace>(
    {
        patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        address: { type: String },
        rating: { type: Number },
        userRatingsTotal: { type: Number },
        mapsUrl: { type: String, required: true },
    },
    { timestamps: true }
);

// A patient can save the same real place only once.
savedPlaceSchema.index({ patient: 1, mapsUrl: 1 }, { unique: true });

export const SavedPlace = model<ISavedPlace>("SavedPlace", savedPlaceSchema);
