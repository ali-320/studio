'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Cloud, CloudRain, Wind, Compass } from 'lucide-react';
import Link from 'next/link';

export function LiveWeather() {
  const weatherStatus = "Partly Cloudy"; // Placeholder
  const temperature = "25°C";
  const wind = "10 km/h NW";

  const getWeatherIcon = () => {
    if (weatherStatus.includes("Rain")) return <CloudRain className="h-10 w-10 text-blue-400" />;
    if (weatherStatus.includes("Cloud")) return <Cloud className="h-10 w-10 text-gray-400" />;
    return <Sun className="h-10 w-10 text-yellow-400" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Weather</CardTitle>
        <CardDescription>What's happening right now</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon()}
            <div>
              <p className="text-4xl font-bold">{temperature}</p>
              <p className="text-muted-foreground">{weatherStatus}</p>
            </div>
          </div>
          <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Wind className="h-5 w-5 text-muted-foreground"/>
                <p className="font-bold">{wind.split(' ')[0]}</p>
                <p className="text-sm text-muted-foreground">{wind.split(' ')[1]}</p>
              </div>
              <p className="text-xs text-muted-foreground">Wind</p>
          </div>
        </div>
        <Link href="https://zoom.earth/maps/wind-speed/#view=5.7,78.2,5z" target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className="w-full">
                <Compass className="mr-2 h-4 w-4" /> View Live Weather Map
            </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
