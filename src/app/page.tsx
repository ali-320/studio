'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, HandHelping, LogIn, MapPin } from 'lucide-react';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { VolunteerApplicationDialog } from '@/components/volunteer-application-dialog';
import { LocationDialog } from '@/components/location-dialog';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';


export default function Home() {
  const { user, loading, firestore } = useFirebase();
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!loading) {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        getDoc(userRef).then(docSnap => {
          if (docSnap.exists() && docSnap.data().location) {
            setIsLocationSet(true);
            router.push('/dashboard');
          } else {
            setIsCheckingLocation(false);
          }
        }).catch(() => setIsCheckingLocation(false));
      } else {
        setIsCheckingLocation(false);
      }
    }
  }, [user, loading, firestore, router]);

  const handleLocationUpdate = async (position: GeolocationPosition) => {
    if (user && firestore) {
      const { latitude, longitude } = position.coords;
      const userRef = doc(firestore, 'users', user.uid);
      
      let address = 'Current Location';
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (data && data.display_name) {
          address = data.display_name;
        }
      } catch (geocodeError) {
        console.error("Reverse geocoding failed:", geocodeError);
        address = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
      }

      const userData = {
        location: { latitude, longitude },
        status: 'available',
        currentLocationAddress: address,
      };

      setDoc(userRef, userData, { merge: true })
        .then(async () => {
            // Save as a "Home" location by default
            const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
            await addDoc(savedLocationsRef, { name: 'Home', address, latitude, longitude });

            setIsLocationSet(true);
            router.push('/dashboard');
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: userRef.path,
              operation: 'write',
              requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
              variant: "destructive",
              title: "Update Failed",
              description: "Could not update your location in our system."
            });
        });
    }
  };

  const handleManualLocation = async (address: string) => {
     if (user && firestore) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);
                
                const userRef = doc(firestore, 'users', user.uid);
                const userData = {
                    location: { latitude, longitude },
                    status: 'available',
                    currentLocationAddress: display_name,
                };
               
                setDoc(userRef, userData, { merge: true }).then(async () => {
                    const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
                    await addDoc(savedLocationsRef, { name: 'Home', address: display_name, latitude, longitude });
                    setIsLocationSet(true);
                    router.push('/dashboard');
                }).catch((serverError) => {
                     const permissionError = new FirestorePermissionError({
                        path: userRef.path,
                        operation: 'write',
                        requestResourceData: userData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Geocoding Failed",
                    description: "Could not find coordinates for that address. Please try a different one.",
                });
            }
        } catch (error) {
            console.error("Geocoding or Firestore update failed:", error);
            toast({
              variant: "destructive",
              title: "Update Failed",
              description: "Could not save your manual location."
            });
        }
    }
  };


  if (loading || isCheckingLocation || (user && isLocationSet)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground">{ (user && isLocationSet) ? 'Redirecting to dashboard...' : 'Checking your status...'}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-headline text-primary">FloodGuard</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Your AI-powered partner in flood safety and response.
            </p>
          </div>

          {user && !isLocationSet ? (
            <Card>
              <CardHeader>
                <CardTitle>Welcome!</CardTitle>
                 <CardDescription>
                  Please set your primary location to start receiving localized alerts and information. This will be saved as "Home".
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LocationDialog onLocationUpdate={handleLocationUpdate} onManualLocationSubmit={handleManualLocation}>
                    <Button className="w-full h-20">
                        <MapPin className="mr-2 h-5 w-5"/> Set Your Location
                    </Button>
                </LocationDialog>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>Sign up or log in to report incidents and receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Button className="w-full h-20" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-5 w-5" /> Login / Sign Up
                  </Link>
                </Button>
                <VolunteerApplicationDialog>
                    <Button className="w-full h-20" variant="secondary">
                        <HandHelping className="mr-2 h-5 w-5"/> Apply to be a Volunteer
                    </Button>
                </VolunteerApplicationDialog>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
