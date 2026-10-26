export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

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

  const results = await nominatimRequest<Array<{ lat: string; lon: string; display_name: string }>>(
    `/search?${new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '1',
      addressdetails: '1',
    }).toString()}`
  );
  const result = results[0];
  const latitude = result ? Number.parseFloat(result.lat) : Number.NaN;
  const longitude = result ? Number.parseFloat(result.lon) : Number.NaN;

  if (!result || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(`No location was found for "${query}".`);
  }

  return { latitude, longitude, address: result.display_name };
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
