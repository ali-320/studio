'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/client-provider';
import { doc, getDoc } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherCharts } from '@/components/dashboard/weather-charts';
import { LiveWeather } from '@/components/dashboard/live-weather';
import { NewsBoard } from '@/components/dashboard/news-board';
import { AIPredictor } from '@/components/dashboard/ai-predictor';
import { ScenarioChecker } from '@/components/dashboard/scenario-checker';
import { AlertTriangle } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
}

export default function DashboardPage() {
  const { user, firestore, loading: authLoading } = useFirebase();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      getDoc(userRef).then(async (docSnap) => {
        if (docSnap.exists() && docSnap.data().location) {
          const userData = docSnap.data();
          const userLocation = userData.location as Location;
          setLocation(userLocation);

          // Determine location name
          if (userData.savedLocations?.home) {
            setLocationName(userData.savedLocations.home);
          } else {
             try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.latitude}&lon=${userLocation.longitude}`);
                const data = await response.json();
                if (data && data.display_name) {
                    setLocationName(data.display_name);
                } else {
                    setLocationName('Current Location');
                }
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
                setLocationName(`Lat: ${userLocation.latitude.toFixed(2)}, Lon: ${userLocation.longitude.toFixed(2)}`);
            }
          }
        } else {
          // If no location, redirect back to home to set it
          router.push('/');
        }
        setLoading(false);
      });
    }
  }, [user, firestore, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }
  
  if (!location) {
     return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Location Not Found</h1>
        <p className="text-muted-foreground mt-2">We couldn't find your location data. Please return to the home page to set it.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 bg-slate-50">
      <div className="container mx-auto">
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-2xl">Flood Risk Dashboard</CardTitle>
                <CardDescription>
                    {locationName ? `Showing data for: ${locationName}` : 'Loading location...'}
                </CardDescription>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-6">
            <WeatherCharts />
            <AIPredictor />
            <ScenarioChecker />
          </div>

          {/* Sidebar column */}
          <div className="space-y-6">
            <LiveWeather />
            <NewsBoard location={locationName} />
          </div>
        </div>
      </div>
    </main>
  );
}
