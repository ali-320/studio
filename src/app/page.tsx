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

export default function Home() {
  const { user, loading, firestore, signInAnonymously } = useFirebase();
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      signInAnonymously?.();
    }
  }, [user, loading, signInAnonymously]);

  useEffect(() => {
    if (user && firestore) {
      const requestLocation = () => {
        setIsLocationLoading(true);
        setLocationError(null);
        navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const userRef = doc(firestore, 'users', user.uid);
            try {
              await setDoc(userRef, {
                location: { latitude, longitude },
                role: user.isAnonymous ? 'anonymous' : 'registered',
                status: 'available',
              }, { merge: true });
              setIsLocationLoading(false);
            } catch (error) {
              console.error("Error updating location:", error);
              setLocationError("Could not update your location in our system.");
              setIsLocationLoading(false);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationError('Location permission denied. Please enable it in your browser settings to receive localized alerts.');
            setIsLocationLoading(false);
            toast({
              variant: 'destructive',
              title: 'Location Access Denied',
              description: 'Please enable location permissions for full functionality.',
            });
          },
          { enableHighAccuracy: true }
        );
      };
      requestLocation();
    }
  }, [user, firestore]);

  if (loading || isLocationLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground">
          {loading ? 'Initializing...' : 'Acquiring your location...'}
        </p>
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
                  You are signed in anonymously. Your location is being monitored for your safety.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {locationError && (
                   <Card className="bg-destructive/10 border-destructive">
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                         <CardTitle className="text-lg font-medium text-destructive-foreground">Location Error</CardTitle>
                         <MapPin className="h-6 w-6 text-destructive-foreground" />
                     </CardHeader>
                     <CardContent>
                         <p className="text-sm text-destructive-foreground">{locationError}</p>
                     </CardContent>
                 </Card>
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
                <Button className="w-full h-20" onClick={signInAnonymously}>
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
