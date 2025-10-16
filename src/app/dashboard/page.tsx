'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/client-provider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherCharts } from '@/components/dashboard/weather-charts';
import { LiveWeather } from '@/components/dashboard/live-weather';
import { NewsBoard } from '@/components/dashboard/news-board';
import { AIPredictor } from '@/components/dashboard/ai-predictor';
import { ScenarioChecker } from '@/components/dashboard/scenario-checker';
import { AlertTriangle, MapPin, Star } from 'lucide-react';
import { LocationDialog } from '@/components/location-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface Location {
  latitude: number;
  longitude: number;
}

interface SavedLocation {
    [key: string]: string;
}

export default function DashboardPage() {
  const { user, firestore, loading: authLoading } = useFirebase();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation | null>(null);
  const [loading, setLoading] = useState(true);
  // Key for re-rendering child components
  const [locationVersion, setLocationVersion] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  const fetchAndSetLocationData = async (uid: string) => {
    if (firestore) {
      setLoading(true);
      const userRef = doc(firestore, 'users', uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists() && docSnap.data().location) {
        const userData = docSnap.data();
        const userLocation = userData.location as Location;
        setLocation(userLocation);
        setSavedLocations(userData.savedLocations || {});
        
        if (userData.currentLocationName) {
            setLocationName(userData.currentLocationName);
        } else if (userData.savedLocations?.home) {
            setLocationName(userData.savedLocations.home);
        } else {
           await reverseGeocode(userLocation.latitude, userLocation.longitude);
        }
      } else {
        // If no location data, redirect to home to set it.
        router.push('/');
      }
      setLoading(false);
      setLocationVersion(v => v + 1); // Increment version to force re-render
    }
  };

  useEffect(() => {
    if (user) {
      fetchAndSetLocationData(user.uid);
    }
  }, [user]);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const name = data && data.display_name ? data.display_name : `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
        setLocationName(name); // Set state for immediate UI update
        return name;
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        const name = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
        setLocationName(name); // Set state for immediate UI update
        return name;
    }
  };


  const handleLocationUpdate = async (position: GeolocationPosition, locationNameToSave?: string) => {
    if (user && firestore) {
      const { latitude, longitude } = position.coords;
      const userRef = doc(firestore, 'users', user.uid);
      
      const newLocationName = await reverseGeocode(latitude, longitude);

      const userData: any = {
        location: { latitude, longitude },
        currentLocationName: newLocationName,
      };

      if (locationNameToSave) {
          const currentSaved = savedLocations || {};
          userData.savedLocations = {
              ...currentSaved,
              [locationNameToSave]: newLocationName
          }
      }
      
      try {
        await setDoc(userRef, userData, { merge: true });
        await fetchAndSetLocationData(user.uid); // Re-fetch all data to ensure consistency
        toast({ title: "Location Updated", description: `Now showing data for ${newLocationName}` });
      } catch (serverError) {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update your location." });
      }
    }
  };

 const handleManualLocation = async (address: string, locationNameToSave?: string) => {
     if (user && firestore) {
        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);
                
                const userRef = doc(firestore, 'users', user.uid);
                
                const currentSaved = savedLocations || {};
                const userData: any = {
                    location: { latitude, longitude },
                    currentLocationName: address,
                };
                if (locationNameToSave) {
                    userData.savedLocations = {
                        ...currentSaved,
                        [locationNameToSave]: address
                    }
                }
                
                await setDoc(userRef, userData, { merge: true });
                await fetchAndSetLocationData(user.uid); // Re-fetch all data
                toast({ title: "Location Updated", description: `Now showing data for ${address}` });
            } else {
                toast({ variant: "destructive", title: "Geocoding Failed", description: "Could not find coordinates for the address." });
            }
        } catch (error) {
            console.error("Geocoding or Firestore update failed:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to set manual location." });
        } finally {
            setLoading(false);
        }
    }
  };


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
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl">Flood Risk Dashboard</CardTitle>
                    <CardDescription>
                        {locationName ? `Showing data for: ${locationName}` : 'Loading location...'}
                    </CardDescription>
                </div>
                 <LocationDialog onLocationUpdate={handleLocationUpdate} onManualLocationSubmit={handleManualLocation} allowSave={true}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MapPin className="mr-2"/>
                                Change Location
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Switch Location</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             {savedLocations && Object.entries(savedLocations).map(([key, value]) => (
                                <DropdownMenuItem key={key} onSelect={() => handleManualLocation(value)}>
                                    <Star className="mr-2 h-4 w-4 text-yellow-400"/>
                                    <span>{key} ({value.substring(0,20)}...)</span>
                                </DropdownMenuItem>
                            ))}
                            {savedLocations && Object.keys(savedLocations).length > 0 && <DropdownMenuSeparator />}
                             <DropdownMenuItem onSelect={(e) => { e.preventDefault(); }}>
                                 <div className="w-full">
                                    <LocationDialog onLocationUpdate={handleLocationUpdate} onManualLocationSubmit={handleManualLocation} allowSave={true}>
                                        <Button variant="ghost" className="w-full justify-start p-0 h-auto font-normal">Add/Edit Location</Button>
                                    </LocationDialog>
                                 </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </LocationDialog>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" key={locationVersion}>
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
