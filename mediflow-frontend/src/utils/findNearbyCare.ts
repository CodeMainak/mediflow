// Finds real, actual nearby healthcare places using the browser's
// geolocation and OpenStreetMap's Overpass API — no seeded/fake data,
// no API key required. Used only in the authenticated dashboard (not the
// offline demo, which is explicitly network-free).

export interface NearbyPlace {
  name: string;
  type: string;
  distanceKm: number;
  mapsUrl: string;
}

const TYPE_LABELS: Record<string, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  doctors: "Doctor's office",
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

/**
 * category "emergency" restricts results to hospitals only; "general"
 * includes clinics, doctors' offices, and pharmacies too.
 */
export async function findNearbyCare(category: 'emergency' | 'general'): Promise<NearbyPlace[]> {
  const position = await getCurrentPosition().catch(() => {
    throw new Error('Location access was denied or unavailable. You can search manually instead.');
  });
  const { latitude, longitude } = position.coords;

  const amenities = category === 'emergency' ? ['hospital'] : ['hospital', 'clinic', 'doctors', 'pharmacy'];
  const clauses = amenities.map((a) => `node["amenity"="${a}"](around:8000,${latitude},${longitude});`).join('\n');
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

  const places: NearbyPlace[] = (data.elements || [])
    .filter((el: any) => el.tags?.name)
    .map((el: any) => ({
      name: el.tags.name,
      type: el.tags.amenity,
      distanceKm: haversineKm(latitude, longitude, el.lat, el.lon),
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${el.lat},${el.lon}`,
    }))
    .sort((a: NearbyPlace, b: NearbyPlace) => a.distanceKm - b.distanceKm)
    .slice(0, 6);

  return places;
}

export function genericMapsSearchUrl(category: 'emergency' | 'general'): string {
  const query = category === 'emergency' ? 'hospital near me' : 'clinic near me';
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}
