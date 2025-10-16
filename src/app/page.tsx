'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserPlus, HandHelping, LogIn, MapPin } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { VolunteerApplicationDialog } from '@/components/volunteer-application-dialog';
import { LocationDialog } from '@/components/location-dialog';

export default function Home() {
  const { user, loading, firestore, signInAnonymously } = useFirebase();
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  
  useEffect(() => {
    if (!loading && !user) {
      signInAnonymously?.();
    }
  }, [user, loading, signInAnonymously]);

  const handleLocationUpdate = async (position: GeolocationPosition) => {
    if (user && firestore) {
      const { latitude, longitude } = position.coords;
      const userRef = doc(firestore, 'users', user.uid);
      try {
        await setDoc(userRef, {
          location: { latitude, longitude },
          role: user.isAnonymous ? 'anonymous' : 'registered',
          status: 'available',
        }, { merge: true });

        // Reverse geocode to get address
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setLocationName(data.display_name);
          } else {
            setLocationName('Current Location');
          }
        } catch (geocodeError) {
            console.error("Reverse geocoding failed:", geocodeError);
            setLocationName(`Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`);
        }
        
        setIsLocationSet(true);
      } catch (error) {
        console.error("Error updating location:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update your location in our system."
        });
      }
    }
  };

  const handleManualLocation = async (address: string) => {
     if (user && firestore) {
      // In a real app, you would geocode the address here.
      // For now, we'll store the address and placeholder coordinates.
      console.log("Manual location set to:", address);
      const userRef = doc(firestore, 'users', user.uid);
       try {
        await setDoc(userRef, {
          savedLocations: { home: address },
          location: { latitude: 0, longitude: 0 }, // Placeholder
          role: user.isAnonymous ? 'anonymous' : 'registered',
          status: 'available',
        }, { merge: true });
        setIsLocationSet(true);
        setLocationName(address);
        toast({
          title: "Location Set Manually",
          description: `Your location has been set to ${address}.`,
        });
       } catch (error) {
        console.error("Error updating manual location:", error);
         toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not save your manual location."
        });
       }
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground">Authenticating...</p>
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

          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Welcome, Resident!</CardTitle>
                <CardDescription>
                  {isLocationSet 
                    ? `Location set to: ${locationName}`
                    : "Please set your location to receive localized alerts."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLocationSet ? (
                  <Card className="bg-green-50 border border-green-200">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-lg font-medium text-green-800">All Clear</CardTitle>
                          <Shield className="h-6 w-6 text-green-600" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-green-700">Risk Level: Low</p>
                          <p className="text-xs text-green-500">No immediate flood threats in your area.</p>
                      </CardContent>
                  </Card>
                ) : (
                   <LocationDialog onLocationUpdate={handleLocationUpdate} onManualLocationSubmit={handleManualLocation}>
                      <Button className="w-full h-20">
                          <MapPin className="mr-2 h-5 w-5"/> Set Your Location
                      </Button>
                   </LocationDialog>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                    <Button className="w-full h-20" disabled>
                        <UserPlus className="mr-2 h-5 w-5"/> Register My Account
                    </Button>
                     <VolunteerApplicationDialog>
                        <Button className="w-full h-20" variant="secondary">
                            <HandHelping className="mr-2 h-5 w-5"/> Apply to be a Volunteer
                        </Button>
                    </VolunteerApplicationDialog>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>Sign in to report incidents and receive alerts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full h-20" onClick={signInAnonymously} disabled={loading}>
                  <LogIn className="mr-2 h-5 w-5" /> Anonymous Login
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
