import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { SavedPlace } from "../models/SavedPlace";

interface GooglePlace {
    name: string;
    rating?: number;
    userRatingsTotal?: number;
    address: string;
    distanceKm: number;
    openNow?: boolean;
    mapsUrl: string;
    type: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function searchType(
    apiKey: string,
    lat: number,
    lng: number,
    type: string,
    keyword?: string
): Promise<any[]> {
    let url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}&radius=8000&type=${type}&key=${apiKey}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

    const response = await fetch(url);
    if (!response.ok) return [];
    const data: any = await response.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places error: ${data.status}`);
    }
    return (data.results || []).map((r: any) => ({ ...r, _type: type }));
}

export const nearbyPlaces = async (req: AuthRequest, res: Response): Promise<void> => {
    const apiKey = process.env["GOOGLE_PLACES_API_KEY"];

    if (!apiKey) {
        res.json({ configured: false, places: [] });
        return;
    }

    try {
        const lat = parseFloat(String(req.query["lat"]));
        const lng = parseFloat(String(req.query["lng"]));
        const category = req.query["category"] === "emergency" ? "emergency" : "general";
        // Specialization from the AI triage (e.g. "Cardiology"), used to bias
        // real results toward the specific specialist actually needed instead
        // of a generic "any doctor nearby" search.
        const keyword = typeof req.query["keyword"] === "string" ? req.query["keyword"].slice(0, 100) : undefined;

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            res.status(400).json({ msg: "Valid lat/lng query params are required." });
            return;
        }

        const types = category === "emergency" ? ["hospital"] : ["hospital", "doctor", "pharmacy"];
        // Pharmacies aren't relevant to a specialty search, and emergencies
        // need the nearest hospital regardless of specialty.
        const resultSets = await Promise.all(
            types.map((t) => searchType(apiKey, lat, lng, t, category === "general" && t !== "pharmacy" ? keyword : undefined))
        );

        const seen = new Set<string>();
        const merged: GooglePlace[] = [];

        for (const results of resultSets) {
            for (const r of results) {
                if (!r.place_id || seen.has(r.place_id) || !r.name || !r.geometry?.location) continue;
                seen.add(r.place_id);
                merged.push({
                    name: r.name,
                    rating: r.rating,
                    userRatingsTotal: r.user_ratings_total,
                    address: r.vicinity || "",
                    distanceKm: haversineKm(lat, lng, r.geometry.location.lat, r.geometry.location.lng),
                    openNow: r.opening_hours?.open_now,
                    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
                    type: r._type,
                });
            }
        }

        // Plain rating desc lets a 5.0 from 1 review outrank a 4.9 from 80,000+
        // reviews. Weight toward a neutral prior until a place has enough
        // ratings to trust, same idea as IMDB's weighted rating.
        const MIN_VOTES = 15;
        const PRIOR_RATING = 4.0;
        const weightedScore = (rating?: number, votes?: number): number => {
            if (!rating || !votes) return 0;
            return (votes / (votes + MIN_VOTES)) * rating + (MIN_VOTES / (votes + MIN_VOTES)) * PRIOR_RATING;
        };

        merged.sort((a, b) => weightedScore(b.rating, b.userRatingsTotal) - weightedScore(a.rating, a.userRatingsTotal));

        res.json({ configured: true, places: merged.slice(0, 15) });
    } catch (err: any) {
        res.status(502).json({ msg: "Could not reach Google Places right now.", error: err.message });
    }
};

export const savePlace = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?._id;
        const { name, type, address, rating, userRatingsTotal, mapsUrl } = req.body || {};

        if (!name || !type || !mapsUrl) {
            res.status(400).json({ msg: "name, type, and mapsUrl are required." });
            return;
        }

        const saved = await SavedPlace.findOneAndUpdate(
            { patient: userId, mapsUrl },
            { patient: userId, name, type, address, rating, userRatingsTotal, mapsUrl },
            { new: true, upsert: true }
        );
        res.json(saved);
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

export const listSavedPlaces = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?._id;
        const places = await SavedPlace.find({ patient: userId }).sort({ createdAt: -1 });
        res.json({ places });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

export const deleteSavedPlace = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?._id;
        await SavedPlace.deleteOne({ _id: req.params.id, patient: userId });
        res.json({ msg: "Removed." });
    } catch (err: any) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};
