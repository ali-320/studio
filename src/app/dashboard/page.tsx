
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/client-provider';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, addDoc, query, where } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WeatherCharts } from '@/components/dashboard/weather-charts';
import { LiveWeather } from '@/components/dashboard/live-weather';
import { NewsBoard } from '@/components/dashboard/news-board';
import { AIPredictor } from '@/components/dashboard/ai-predictor';
import { ScenarioChecker } from '@/components/dashboard/scenario-checker';
import { AlertTriangle, MapPin, Star, Trash2 } from 'lucide-react';
import { LocationDialog } from '@/components/location-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { AlertsDisplay } from '@/components/dashboard/alerts-display';

interface Location {
  latitude: number;
  longitude: number;
}

interface SavedLocation {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

export default function DashboardPage() {
  const { user, firestore, loading: authLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [locationVersion, setLocationVersion] = useState(0);

  const fetchAndSetLocationData = async (uid: string) => {
    if (!firestore) return;
    setLoading(true);

    try {
        const userRef = doc(firestore, 'users', uid);
        const userDocSnap = await getDoc(userRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.location) {
                setCurrentLocation(userData.location as Location);
                setCurrentLocationAddress(userData.currentLocationAddress || `Lat: ${userData.location.latitude.toFixed(2)}, Lon: ${userData.location.longitude.toFixed(2)}`);

                const savedLocationsRef = collection(firestore, 'users', uid, 'savedLocations');
                const savedLocationsSnap = await getDocs(savedLocationsRef);
                const userSavedLocations = savedLocationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedLocation));
                setSavedLocations(userSavedLocations);

                setLocationVersion(v => v + 1); // Force re-render of components using the key
            } else {
                // If user has no location, send them to home to set it.
                router.push('/');
            }
        } else {
            console.error("User document not found.");
            router.push('/');
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch your data." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if(user && firestore) {
      fetchAndSetLocationData(user.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router, firestore]);

  const updateUserLocation = async (lat: number, lon: number, address: string) => {
      if (!user || !firestore) return;
      const userRef = doc(firestore, 'users', user.uid);
      const newLocationData = {
          location: { latitude: lat, longitude: lon },
          currentLocationAddress: address
      };
      setDoc(userRef, newLocationData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
              path: userRef.path, operation: 'update', requestResourceData: newLocationData,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleLocationUpdate = async (position: GeolocationPosition, locationNameToSave?: string) => {
    if (user && firestore) {
      setLoading(true);
      const { latitude, longitude } = position.coords;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        const address = data?.display_name || `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;

        await updateUserLocation(latitude, longitude, address);

        if (locationNameToSave) {
            const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
            const newLocation = { name: locationNameToSave, address, latitude, longitude };
            await addDoc(savedLocationsRef, newLocation);
        }
        
        await fetchAndSetLocationData(user.uid);
        toast({ title: "Location Updated", description: `Now showing data for ${address}` });

      } catch (error) {
         console.error("Error updating location:", error);
         toast({ variant: "destructive", title: "Error", description: "Failed to update location." });
      } finally {
         setLoading(false);
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
                const { lat, lon, display_name } = data[0];
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);
                
                await updateUserLocation(latitude, longitude, display_name);

                if (locationNameToSave) {
                    const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
                    const newLocation = { name: locationNameToSave, address: display_name, latitude, longitude };
                    await addDoc(savedLocationsRef, newLocation);
                }
                
                await fetchAndSetLocationData(user.uid); 
                toast({ title: "Location Updated", description: `Now showing data for ${display_name}` });
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
  
  const handleSelectSavedLocation = async (location: SavedLocation) => {
      await updateUserLocation(location.latitude, location.longitude, location.address);
      await fetchAndSetLocationData(user!.uid);
      toast({ title: "Location Switched", description: `Now showing data for ${location.name}` });
  };

  const handleDeleteLocation = async (locationId: string) => {
      if (user && firestore) {
          const locRef = doc(firestore, 'users', user.uid, 'savedLocations', locationId);
          try {
              await deleteDoc(locRef);
              toast({ title: "Location Deleted", description: "The location has been removed." });
              router.refresh();
          } catch (serverError: any) {
              const permissionError = new FirestorePermissionError({
                  path: locRef.path,
                  operation: 'delete',
              });
              errorEmitter.emit('permission-error', permissionError);
              toast({ variant: "destructive", title: "Deletion Failed", description: serverError.message || "Could not delete the location." });
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
  
  if (!currentLocation) {
     return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Location Not Found</h1>
        <p className="text-muted-foreground mt-2">We couldn't find your location data. Please return to the home page to set it.</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Go Home
        </Button>
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
                    <CardTitle className="text-2xl">Flood Risk Dashboard</CardTitle>
                    <CardDescription>
                        {currentLocationAddress ? `Showing data for: ${currentLocationAddress}` : 'Loading location...'}
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
                         {savedLocations.map((loc) => (
                            <DropdownMenuItem key={loc.id} onSelect={() => handleSelectSavedLocation(loc)} className="flex justify-between items-center pr-2">
                                <div className="flex items-center gap-2">
                                    <Star className="mr-2 h-4 w-4 text-yellow-400"/>
                                    <span className="flex flex-col">
                                        <span className="font-semibold">{loc.name}</span>
                                        <span className="text-xs text-muted-foreground">{loc.address.substring(0,25)}...</span>
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }}>
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
            <NewsBoard location={currentLocationAddress} />
          </div>
        </div>
      </div>
    </main>
  );
}
