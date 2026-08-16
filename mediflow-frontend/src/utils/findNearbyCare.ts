// Finds real, actual nearby healthcare places for the authenticated
// dashboard (not the offline demo, which is explicitly network-free).
//
// Two real data sources, tried in order:
//   1. Google Places (via our backend, so the API key stays server-side)
//      — real ratings, real review counts, real "open now" status.
//   2. OpenStreetMap's Overpass API — real places, no ratings, but free
//      and needs no API key, so it's always available as a fallback.

import api from '../services/api';

export type PlaceSource = 'google' | 'osm';

export interface NearbyPlace {
  name: string;
  type: string;
  distanceKm: number;
  mapsUrl: string;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
}

export interface NearbyCareResult {
  source: PlaceSource;
  places: NearbyPlace[];
}

const TYPE_LABELS: Record<string, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  doctors: "Doctor's office",
  doctor: "Doctor's office",
  pharmacy: 'Pharmacy',
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Your browser does not support location lookup.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 });
  });
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

async function fetchGooglePlaces(lat: number, lng: number, category: 'emergency' | 'general', keyword?: string): Promise<NearbyPlace[] | null> {
  try {
    const res = await api.get('/api/places/nearby', { params: { lat, lng, category, keyword } });
    if (!res.data?.configured) return null; // key not set up — fall back to OSM
    return (res.data.places || []).map((p: any) => ({
      name: p.name,
      type: p.type,
      distanceKm: p.distanceKm,
      mapsUrl: p.mapsUrl,
      rating: p.rating,
      userRatingsTotal: p.userRatingsTotal,
      openNow: p.openNow,
    }));
  } catch {
    return null; // backend/Google hiccup — fall back to OSM rather than failing outright
  }
}

async function fetchOsmPlaces(lat: number, lng: number, category: 'emergency' | 'general'): Promise<NearbyPlace[]> {
  const amenities = category === 'emergency' ? ['hospital'] : ['hospital', 'clinic', 'doctors', 'pharmacy'];
  const clauses = amenities.map((a) => `node["amenity"="${a}"](around:8000,${lat},${lng});`).join('\n');
  const query = `[out:json][timeout:15];(${clauses});out center 25;`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let data: any;
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    throw new Error('Could not reach the map service right now. You can search manually instead.');
  } finally {
    clearTimeout(timeout);
  }

  return (data.elements || [])
    .filter((el: any) => el.tags?.name)
    .map((el: any) => ({
      name: el.tags.name,
      type: el.tags.amenity,
      distanceKm: haversineKm(lat, lng, el.lat, el.lon),
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${el.lat},${el.lon}`,
    }))
    .sort((a: NearbyPlace, b: NearbyPlace) => a.distanceKm - b.distanceKm)
    .slice(0, 6);
}

/**
 * category "emergency" restricts results to hospitals only; "general"
 * includes clinics, doctors' offices, and pharmacies too. `keyword` (e.g.
 * "Cardiology") biases the real Google results toward that specialty when
 * available — ignored by the OSM fallback, which can't do keyword search.
 */
export async function findNearbyCare(category: 'emergency' | 'general', keyword?: string): Promise<NearbyCareResult> {
  const position = await getCurrentPosition().catch(() => {
    throw new Error('Location access was denied or unavailable. You can search manually instead.');
  });
  const { latitude, longitude } = position.coords;

  const googlePlaces = await fetchGooglePlaces(latitude, longitude, category, keyword);
  if (googlePlaces && googlePlaces.length > 0) {
    return { source: 'google', places: googlePlaces };
  }

  const osmPlaces = await fetchOsmPlaces(latitude, longitude, category);
  return { source: 'osm', places: osmPlaces };
}

export function genericMapsSearchUrl(category: 'emergency' | 'general', keyword?: string): string {
  const query = category === 'emergency' ? 'hospital near me' : `${keyword || 'clinic'} near me`;
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}
