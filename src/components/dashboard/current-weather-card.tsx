
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudRain, Wind, Thermometer, Sunrise, Sunset, Sun, Map } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CurrentWeatherCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline flex items-center gap-2">
            <Sun className="h-6 w-6 text-primary" />
            Current Weather
        </CardTitle>
        <Link href="https://www.windy.com" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <Map className="mr-2 h-4 w-4" />
            Live Map
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CloudRain className="h-10 w-10 text-primary" />
            <div>
              <p className="text-4xl font-bold">18°C</p>
              <p className="text-muted-foreground">Heavy Rain</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Feels like</p>
              <p className="text-muted-foreground">16°C</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Wind</p>
              <p className="text-muted-foreground">15 km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Sunrise</p>
              <p className="text-muted-foreground">6:05 AM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sunset className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Sunset</p>
              <p className="text-muted-foreground">7:30 PM</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
