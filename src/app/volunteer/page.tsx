
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useFirebase } from '@/firebase/client-provider';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ShieldOff } from 'lucide-react';
import { VolunteerDashboard } from '@/components/volunteer/volunteer-dashboard';

export default function VolunteerPage() {
    const { user, loading: authLoading } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const isLoading = authLoading || profileLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
                <Loader />
                <p className="text-muted-foreground">Verifying volunteer status...</p>
            </div>
        );
    }
    
    if (profile?.role !== 'volunteer') {
        return (
            <main className="flex-1 p-4 md:p-6">
                <div className="container mx-auto max-w-2xl text-center">
                    <Alert variant="destructive">
                        <ShieldOff className="h-4 w-4" />
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>
                            This page is for authorized volunteers only. If you are a volunteer and believe this is an error, please contact support.
                        </AlertDescription>
                    </Alert>
                </div>
            </main>
        );
    }

    return <VolunteerDashboard profile={profile} />;
}
