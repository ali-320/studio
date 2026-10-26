'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Cloud, CloudRain, Wind, Compass } from 'lucide-react';
import Link from 'next/link';
<<<<<<< HEAD
import { useMemo } from 'react';

interface LiveWeatherProps {
  location: { latitude: number; longitude: number };
  address?: string;
}

export function LiveWeather({ location, address }: LiveWeatherProps) {
  // Deterministic mock weather based on location
  const weatherData = useMemo(() => {
    const seed = Math.abs(Math.sin(location.latitude * 12.9898 + location.longitude * 78.233)) * 43758.5453;
    const tempValue = 15 + (seed % 20);
    const windValue = 5 + (seed % 15);
    
    let status = "Clear Sky";
    if (seed % 3 < 1) status = "Partly Cloudy";
    else if (seed % 3 < 2) status = "Showers";

    return {
      temp: `${tempValue.toFixed(1)}°C`,
      wind: `${windValue.toFixed(1)} km/h`,
      status
    };
  }, [location]);

  const getWeatherIcon = () => {
    if (weatherData.status.includes("Rain") || weatherData.status.includes("Showers")) return <CloudRain className="h-10 w-10 text-blue-400" />;
    if (weatherData.status.includes("Cloud")) return <Cloud className="h-10 w-10 text-gray-400" />;
=======
import { useEffect, useState } from 'react';

interface LiveWeatherProps {
  latitude: number;
  longitude: number;
}

interface WeatherState {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
}

function getWeatherStatus(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67 || (code >= 80 && code <= 82)) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

function getWindDirection(degrees: number): string {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8];
}

export function LiveWeather({ latitude, longitude }: LiveWeatherProps) {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setWeather(null);
    setError(false);

    fetch(`https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
    }).toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);
        const data = await response.json();
        return data.current as {
          temperature_2m: number;
          weather_code: number;
          wind_speed_10m: number;
          wind_direction_10m: number;
        };
      })
      .then((current) => setWeather({
        temperature: current.temperature_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        weatherCode: current.weather_code,
      }))
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        console.error('Weather lookup failed:', fetchError);
        setError(true);
      });

    return () => controller.abort();
  }, [latitude, longitude]);

  const weatherStatus = weather ? getWeatherStatus(weather.weatherCode) : 'Loading weather...';

  const getWeatherIcon = () => {
    if (weatherStatus.includes("Rain") || weatherStatus.includes("Thunder")) return <CloudRain className="h-10 w-10 text-blue-400" />;
    if (weatherStatus.includes("Cloud")) return <Cloud className="h-10 w-10 text-gray-400" />;
>>>>>>> 99ce519 (Use real weather trends and AI flood prediction)
    return <Sun className="h-10 w-10 text-yellow-400" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Weather</CardTitle>
        <CardDescription>{address || "Current Location"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon()}
            <div>
<<<<<<< HEAD
              <p className="text-4xl font-bold">{weatherData.temp}</p>
              <p className="text-muted-foreground">{weatherData.status}</p>
=======
              <p className="text-4xl font-bold">{weather ? `${Math.round(weather.temperature)}°C` : '--'}</p>
                <p className="text-muted-foreground">{error ? 'Weather unavailable' : weatherStatus}</p>
>>>>>>> 99ce519 (Use real weather trends and AI flood prediction)
            </div>
          </div>
          <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Wind className="h-5 w-5 text-muted-foreground"/>
<<<<<<< HEAD
                <p className="font-bold">{weatherData.wind.split(' ')[0]}</p>
                <p className="text-sm text-muted-foreground">{weatherData.wind.split(' ')[1]}</p>
=======
                <p className="font-bold">{weather ? `${Math.round(weather.windSpeed)} km/h` : '--'}</p>
                {weather && <p className="text-sm text-muted-foreground">{getWindDirection(weather.windDirection)}</p>}
>>>>>>> 99ce519 (Use real weather trends and AI flood prediction)
              </div>
              <p className="text-xs text-muted-foreground">Wind</p>
          </div>
        </div>
        <Link href={`https://zoom.earth/maps/wind-speed/#view=${location.latitude},${location.longitude},10z`} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className="w-full">
                <Compass className="mr-2 h-4 w-4" /> View Live Weather Map
            </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
