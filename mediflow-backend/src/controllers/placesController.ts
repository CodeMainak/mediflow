import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";

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
    type: string
): Promise<any[]> {
    const url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}&radius=8000&type=${type}&key=${apiKey}`;

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

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            res.status(400).json({ msg: "Valid lat/lng query params are required." });
            return;
        }

        const types = category === "emergency" ? ["hospital"] : ["hospital", "doctor", "pharmacy"];
        const resultSets = await Promise.all(types.map((t) => searchType(apiKey, lat, lng, t)));

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

        merged.sort((a, b) => {
            const ratingDiff = (b.rating || 0) - (a.rating || 0);
            if (Math.abs(ratingDiff) > 0.01) return ratingDiff;
            return (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0);
        });

        res.json({ configured: true, places: merged.slice(0, 15) });
    } catch (err: any) {
        res.status(502).json({ msg: "Could not reach Google Places right now.", error: err.message });
    }
};
