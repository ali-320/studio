'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase } from '@/firebase/client-provider';
import { Loader } from '@/components/ui/loader';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader />
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
                    <CardTitle>Welcome, {user.isAnonymous ? 'Guest' : user.displayName || 'User'}!</CardTitle>
                    <CardDescription>What would you like to do today?</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <Link href="/report" passHref>
                        <Button className="w-full h-24 text-lg" variant="destructive">
                            <ShieldCheck className="mr-2 h-6 w-6"/> Report an Incident
                        </Button>
                    </Link>
                    <Link href="/dashboard" passHref>
                        <Button className="w-full h-24 text-lg" variant="outline">
                            View Alerts Dashboard
                        </Button>
                    </Link>
                </CardContent>
             </Card>
          ) : (
            <Card>
                <CardHeader>
                    <CardTitle>Get Started</CardTitle>
                    <CardDescription>Log in or sign up to report incidents and receive alerts.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <Button className="w-full h-20">
                       <LogIn className="mr-2 h-5 w-5"/> Anonymous Login
                    </Button>
                    <Button className="w-full h-20">
                        <UserPlus className="mr-2 h-5 w-5"/> Register with Phone
                    </Button>
                     <Button className="w-full h-20" variant="secondary">
                        Volunteer/Admin Login
                    </Button>
                </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
