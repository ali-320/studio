import { strict as assert } from 'node:assert';

type Test = { name: string; run: () => Promise<void> };
const tests: Test[] = [
  {
    name: 'current weather API',
    run: async () => {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.6844&longitude=73.0479&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=auto');
      assert.equal(response.ok, true, `HTTP ${response.status}`);
      const data = await response.json() as { current?: { temperature_2m?: number } };
      assert.equal(typeof data.current?.temperature_2m, 'number');
    },
  },
  {
    name: 'historical weather API',
    run: async () => {
      const response = await fetch('https://archive-api.open-meteo.com/v1/archive?latitude=33.6844&longitude=73.0479&start_date=2025-01-01&end_date=2025-01-03&daily=temperature_2m_mean,precipitation_sum&timezone=auto');
      assert.equal(response.ok, true, `HTTP ${response.status}`);
      const data = await response.json() as { daily?: { time?: string[] } };
      assert.ok((data.daily?.time?.length || 0) > 0);
    },
  },
  {
    name: 'location geocoding API',
    run: async () => {
      const response = await fetch('https://nominatim.openstreetmap.org/search?q=Islamabad%20Pakistan&format=jsonv2&limit=1', {
        headers: { 'User-Agent': 'Nigehbaan/1.0 smoke test' },
      });
      assert.equal(response.ok, true, `HTTP ${response.status}`);
      const data = await response.json() as Array<{ lat?: string; lon?: string }>;
      assert.ok(data.length > 0 && data[0].lat && data[0].lon);
    },
  },
  {
    name: 'location normalization and coordinate input',
    run: async () => {
      const { geocodeAddress } = await import('../src/lib/location');
      const place = await geocodeAddress('karak khyber pakhtun khwa');
      assert.ok(Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
      const coordinates = await geocodeAddress('33.6844, 73.0479');
      assert.equal(coordinates.latitude, 33.6844);
      assert.equal(coordinates.longitude, 73.0479);
    },
  },
];

async function main() {
  let failures = 0;
  for (const test of tests) {
    try {
      await test.run();
      console.log(`PASS ${test.name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${test.name}:`, error instanceof Error ? error.message : error);
    }
  }

  try {
    const { predictFloodRisk } = await import('../src/ai/flows/predict-flood-risk-flow');
    const result = await predictFloodRisk({
      location: 'Islamabad, Pakistan',
      temperature: 17.7,
      precipitation: 0,
      windSpeed: 8.1,
      weatherCondition: 'Clear sky',
    });
    assert.ok(['Low', 'Moderate', 'High', 'Severe'].includes(result.risk));
    assert.ok(result.reason.length > 0);
    console.log('PASS Gemini flood-risk flow');
  } catch (error) {
    failures += 1;
    console.error('FAIL Gemini flood-risk flow:', error instanceof Error ? error.message : error);
  }

  if (failures > 0) process.exitCode = 1;
}

void main();
