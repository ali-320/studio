export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const PHOTON_URL = 'https://photon.komoot.io/api/';

async function nominatimRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${NOMINATIM_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Location service returned ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function geocodeAddress(address: string): Promise<GeocodedLocation> {
  const query = address.trim();
  if (!query) {
    throw new Error('Please enter a location.');
  }

  const coordinateMatch = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (coordinateMatch) {
    const latitude = Number.parseFloat(coordinateMatch[1]);
    const longitude = Number.parseFloat(coordinateMatch[2]);
    if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      return {
        latitude,
        longitude,
        address: `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      };
    }
  }

  const normalizedQueries = Array.from(new Set([
    query,
    query.replace(/\bkhyber\s+pakhtun\s+khwa\b/gi, 'Khyber Pakhtunkhwa'),
    query.replace(/\bpakhtun\s+khwa\b/gi, 'Pakhtunkhwa'),
  ]));

  for (const candidate of normalizedQueries) {
    try {
      const results = await nominatimRequest<Array<{ lat: string; lon: string; display_name: string }>>(
        `/search?${new URLSearchParams({
          q: candidate,
          format: 'jsonv2',
          limit: '1',
          addressdetails: '1',
        }).toString()}`
      );
      const result = results[0];
      const latitude = result ? Number.parseFloat(result.lat) : Number.NaN;
      const longitude = result ? Number.parseFloat(result.lon) : Number.NaN;
      if (result && Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude, address: result.display_name };
      }
    } catch (error) {
      console.warn('Nominatim lookup failed; trying another geocoder.', error);
    }
  }

  for (const candidate of normalizedQueries) {
    const photonResponse = await fetch(`${PHOTON_URL}?${new URLSearchParams({ q: candidate, limit: '1' }).toString()}`);
    if (photonResponse.ok) {
      const data = await photonResponse.json() as {
        features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: Record<string, string> }>;
      };
      const result = data.features?.[0];
      const coordinates = result?.geometry?.coordinates;
      if (coordinates && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
        const properties = result.properties || {};
        return {
          latitude: coordinates[1],
          longitude: coordinates[0],
          address: [properties.name, properties.city, properties.state, properties.country].filter(Boolean).join(', ') || candidate,
        };
      }
    }
  }

  const fallback = await fetch(`${OPEN_METEO_GEOCODING_URL}?${new URLSearchParams({
    name: query,
    count: '1',
    language: 'en',
    format: 'json',
  }).toString()}`);
  if (fallback.ok) {
    const data = await fallback.json() as { results?: Array<{ latitude: number; longitude: number; name: string; country?: string; admin1?: string }> };
    const result = data.results?.[0];
    if (result && Number.isFinite(result.latitude) && Number.isFinite(result.longitude)) {
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        address: [result.name, result.admin1, result.country].filter(Boolean).join(', '),
      };
    }
  }

  throw new Error(`No location was found for "${query}". Try "place, region, country" or enter latitude, longitude.`);
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const result = await nominatimRequest<{ display_name?: string }>(
    `/reverse?${new URLSearchParams({
      format: 'jsonv2',
      lat: String(latitude),
      lon: String(longitude),
    }).toString()}`
  );

  return result.display_name || `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
}

export interface SearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

export async function searchLocations(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.trim().length < 3) {
    return [];
  }

  const results = await nominatimRequest<SearchResult[]>(
    `/search?${new URLSearchParams({
      q: query.trim(),
      format: 'jsonv2',
      limit: '5',
      addressdetails: '1',
      'accept-language': 'en',
    }).toString()}`
  );

  return results || [];
}
