'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/client-provider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, deleteDoc, doc, onSnapshot, setDoc, addDoc, query } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WeatherCharts } from '@/components/dashboard/weather-charts';
import { LiveWeather } from '@/components/dashboard/live-weather';
import { NewsBoard } from '@/components/dashboard/news-board';
import { ScenarioChecker } from '@/components/dashboard/scenario-checker';
import { AlertTriangle, MapPin, Star, Trash2 } from 'lucide-react';
import { LocationDialog } from '@/components/location-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { AlertsDisplay } from '@/components/dashboard/alerts-display';
import { AIPredictor } from '@/components/dashboard/ai-predictor';
import { geocodeAddress, reverseGeocode } from '@/lib/location';

interface SavedLocation {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

export default function DashboardPage() {
  const { user, firestore, loading: authLoading } = useFirebase();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Sync saved locations in real-time
  useEffect(() => {
    if (!firestore || !user) return;

    const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
    const q = query(savedLocationsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedLocation));
      setSavedLocations(locations);
      setLoadingSaved(false);
    }, (error) => {
      console.error("Error listening to saved locations:", error);
      setLoadingSaved(false);
    });

    return () => unsubscribe();
  }, [firestore, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const updateUserLocation = async (lat: number, lon: number, address: string) => {
      if (!user || !firestore) return;
      const userRef = doc(firestore, 'users', user.uid);
      const newLocationData = {
          location: { latitude: lat, longitude: lon },
          currentLocationAddress: address
      };
      try {
        await setDoc(userRef, newLocationData, { merge: true });
      } catch (serverError) {
          const permissionError = new FirestorePermissionError({
              path: userRef.path, operation: 'update', requestResourceData: newLocationData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw serverError;
      }
  };

  const handleLocationUpdate = async (position: GeolocationPosition, locationNameToSave?: string) => {
    if (user && firestore) {
      const { latitude, longitude } = position.coords;
      
      try {
        let address: string;
        try {
          address = await reverseGeocode(latitude, longitude);
        } catch (reverseGeocodeError) {
          console.error("Reverse geocoding failed:", reverseGeocodeError);
          address = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
        }

        await updateUserLocation(latitude, longitude, address);

        if (locationNameToSave) {
            const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
            await addDoc(savedLocationsRef, { name: locationNameToSave, address, latitude, longitude });
        }
        
        toast({ title: "Location Updated", description: `Now showing data for ${address}` });
      } catch (error) {
         console.error("Error updating location:", error);
         toast({ variant: "destructive", title: "Error", description: "Failed to update location." });
      }
    }
  };

 const handleManualLocation = async (address: string, locationNameToSave?: string) => {
     if (user && firestore) {
        try {
            const location = await geocodeAddress(address);
            await updateUserLocation(location.latitude, location.longitude, location.address);

            if (locationNameToSave) {
                const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
                await addDoc(savedLocationsRef, {
                    name: locationNameToSave,
                    address: location.address,
                    latitude: location.latitude,
                    longitude: location.longitude,
                });
            }

            toast({ title: "Location Updated", description: `Now showing data for ${location.address}` });
        } catch (error) {
            console.error("Geocoding or Firestore update failed:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to set manual location." });
        }
    }
  };
  
  const handleSelectSavedLocation = (location: SavedLocation) => {
      void updateUserLocation(location.latitude, location.longitude, location.address);
      toast({ title: "Location Switched", description: `Now showing data for ${location.name}` });
  };

  const handleDeleteLocation = async (locationId: string) => {
      if (user && firestore) {
          const locRef = doc(firestore, 'users', user.uid, 'savedLocations', locationId);
          try {
              await deleteDoc(locRef);
              toast({ title: "Location Deleted", description: "The location has been removed." });
          } catch (serverError: any) {
              const permissionError = new FirestorePermissionError({
                  path: locRef.path,
                  operation: 'delete',
              });
              errorEmitter.emit('permission-error', permissionError);
          }
      }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }
  
  if (!profile?.location) {
     return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-4">
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Nigehbaan</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Your AI-powered partner in flood safety and response.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome to Your Dashboard!</CardTitle>
              <CardDescription>
                Please set your primary location to start receiving localized alerts, weather data, and flood predictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocationDialog
                onLocationUpdate={handleLocationUpdate}
                onManualLocationSubmit={handleManualLocation}
                allowSave={true}
              >
                <Button className="w-full h-20" size="lg">
                  <MapPin className="mr-2 h-5 w-5" /> Set Your Location
                </Button>
              </LocationDialog>
              <p className="text-xs text-muted-foreground text-center">
                This will be saved as your default location. You can add more locations later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 bg-slate-50">
      <AlertsDisplay />
      <div className="container mx-auto">
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl">Nigehbaan Dashboard</CardTitle>
                    <CardDescription>
                        {profile.currentLocationAddress || 'Loading location...'}
                    </CardDescription>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <MapPin className="mr-2"/>
                            Change Location
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Switch Location</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         {loadingSaved ? <div className="p-2 text-center text-xs text-muted-foreground">Loading...</div> : savedLocations.map((loc) => (
                            <DropdownMenuItem key={loc.id} onSelect={() => handleSelectSavedLocation(loc)} className="flex justify-between items-center pr-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Star className="h-4 w-4 text-yellow-400 shrink-0"/>
                                    <span className="flex flex-col overflow-hidden">
                                        <span className="font-semibold truncate">{loc.name}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">{loc.address}</span>
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </DropdownMenuItem>
                        ))}
                        {savedLocations.length > 0 && <DropdownMenuSeparator />}
                         <DropdownMenuItem onSelect={(e) => { e.preventDefault(); }}>
                             <div className="w-full">
                                <LocationDialog onLocationUpdate={handleLocationUpdate} onManualLocationSubmit={handleManualLocation} allowSave={true}>
                                    <Button variant="ghost" className="w-full justify-start p-0 h-auto font-normal">Add New Location</Button>
                                </LocationDialog>
                             </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {profile.location && (
              <>
                <AIPredictor
                  latitude={profile.location.latitude}
                  longitude={profile.location.longitude}
                  location={profile.currentLocationAddress || 'selected location'}
                />
                <WeatherCharts
                  latitude={profile.location.latitude}
                  longitude={profile.location.longitude}
                />
              </>
            )}
            <ScenarioChecker />
          </div>

          <div className="space-y-6">
            {profile.location && (
              <LiveWeather
                latitude={profile.location.latitude}
                longitude={profile.location.longitude}
              />
            )}
            <NewsBoard location={profile.currentLocationAddress || null} />
          </div>
        </div>
      </div>
    </main>
  );
}
