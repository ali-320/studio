'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Cloud, CloudRain, Wind, Compass } from 'lucide-react';
import Link from 'next/link';
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
              <p className="text-4xl font-bold">{weatherData.temp}</p>
              <p className="text-muted-foreground">{weatherData.status}</p>
            </div>
          </div>
          <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Wind className="h-5 w-5 text-muted-foreground"/>
                <p className="font-bold">{weatherData.wind.split(' ')[0]}</p>
                <p className="text-sm text-muted-foreground">{weatherData.wind.split(' ')[1]}</p>
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
