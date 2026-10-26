'use client';

import { useState } from 'react';
import { predictFloodRisk, type FloodRiskOutput } from '@/ai/flows/predict-flood-risk-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

interface AIPredictorProps {
  latitude: number;
  longitude: number;
  location: string;
}

interface CurrentWeatherResponse {
  current?: {
    temperature_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

function weatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67 || (code >= 80 && code <= 82)) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

function riskColor(risk: FloodRiskOutput['risk']): string {
  return {
    Low: 'text-green-600',
    Moderate: 'text-yellow-600',
    High: 'text-orange-600',
    Severe: 'text-red-600',
  }[risk];
}

export function AIPredictor({ latitude, longitude, location }: AIPredictorProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<FloodRiskOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePrediction = async () => {
    setLoading(true);
    setPrediction(null);
    setError(null);
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: 'temperature_2m,precipitation,wind_speed_10m,weather_code',
        wind_speed_unit: 'kmh',
        timezone: 'auto',
      }).toString()}`);
      if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);
      const data = await response.json() as CurrentWeatherResponse;
      if (!data.current) throw new Error('Current weather data was unavailable.');

      const result = await predictFloodRisk({
        location,
        temperature: data.current.temperature_2m,
        precipitation: data.current.precipitation,
        windSpeed: data.current.wind_speed_10m,
        weatherCondition: weatherDescription(data.current.weather_code),
      });
      setPrediction(result);
    } catch (predictionError) {
      console.error('Flood prediction failed:', predictionError);
      setError('Could not generate a flood-risk assessment. Check that the AI key is configured and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap className="text-primary" /> AI Flood Predictor</CardTitle>
        <CardDescription>Assess risk using current weather for the selected location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <Button onClick={handlePrediction} disabled={loading} className="w-full md:w-1/2">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing live weather...</> : 'Predict Flood Chance'}
        </Button>
        {error && <p className="text-left text-sm text-destructive">{error}</p>}
        {prediction && !loading && (
          <div className="border-t pt-4 text-left">
            <h3 className="font-bold text-lg">Prediction Result</h3>
            <p className={`text-3xl font-bold ${riskColor(prediction.risk)}`}>{prediction.risk} Risk</p>
            <p className="mt-2 text-muted-foreground"><span className="font-semibold">Reasoning:</span> {prediction.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
