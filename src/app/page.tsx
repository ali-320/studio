
'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HandHelping, MapPin } from 'lucide-react';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { VolunteerApplicationDialog } from '@/components/volunteer-application-dialog';
import { LocationDialog } from '@/components/location-dialog';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { geocodeAddress, reverseGeocode } from '@/lib/location';

export const dynamic = 'force-dynamic';

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
        // If not logged in, redirect to login page.
        const intent = new URLSearchParams(window.location.search).get('intent');
        const loginUrl = intent ? `/login?intent=${intent}` : '/login';
        router.push(loginUrl);
      }
    }
  }, [user, loading, firestore, router]);

  const handleLocationUpdate = async (position: GeolocationPosition) => {
    if (user && firestore) {
      const { latitude, longitude } = position.coords;
      const userRef = doc(firestore, 'users', user.uid);
      
      let address = 'Current Location';
      try {
        address = await reverseGeocode(latitude, longitude);
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
            const location = await geocodeAddress(address);
            {
                const { latitude, longitude } = location;
                const userRef = doc(firestore, 'users', user.uid);
                const userData = {
                    location: { latitude, longitude },
                    status: 'available',
                    currentLocationAddress: location.address,
                };
               
                setDoc(userRef, userData, { merge: true }).then(async () => {
                    const savedLocationsRef = collection(firestore, 'users', user.uid, 'savedLocations');
                    await addDoc(savedLocationsRef, { name: 'Home', address: location.address, latitude, longitude });
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
            }
        } catch (error) {
            console.error("Geocoding or Firestore update failed:", error);
            toast({
              variant: "destructive",
              title: "Location Not Found",
              description: error instanceof Error ? error.message : "Could not save your manual location."
            });
        }
    }
  };


  if (loading || isCheckingLocation || !user || isLocationSet) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground">{ (user && isLocationSet) ? 'Redirecting to dashboard...' : 'Checking your status...'}</p>
      </div>
    );
  }

  // This part of the code will now only be reached by logged-in users without a location set.
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-headline text-primary">Nigehbaan</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Your AI-powered partner in flood safety and response.
            </p>
          </div>

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
        </div>
      </main>
    </div>
  );
}
