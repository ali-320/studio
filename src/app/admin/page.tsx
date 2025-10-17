'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useFirebase } from '@/firebase/client-provider';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldOff } from 'lucide-react';
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';

interface VolunteerApplication {
    id: string;
    userId: string;
    name: string;
    expertise: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function AdminPage() {
    const { user, loading: authLoading } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const router = useRouter();
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!firestore || profile?.role !== 'admin') {
            setLoadingApps(false);
            return;
        };

        const q = query(collection(firestore, 'volunteerApplications'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps: VolunteerApplication[] = [];
            snapshot.forEach(doc => {
                apps.push({ id: doc.id, ...doc.data() } as VolunteerApplication);
            });
            setApplications(apps);
            setLoadingApps(false);
        });

        return () => unsubscribe();

    }, [firestore, profile]);


    const handleApplicationStatus = async (appId: string, userId: string, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;

        const appRef = doc(firestore, 'volunteerApplications', appId);
        const userRef = doc(firestore, 'users', userId);

        try {
            await updateDoc(appRef, { status: newStatus });

            if (newStatus === 'approved') {
                await updateDoc(userRef, { role: 'volunteer' });
            }

            toast({
                title: `Application ${newStatus}`,
                description: `The application has been successfully ${newStatus}.`,
            });
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: appRef.path,
                operation: 'update',
                requestResourceData: { status: newStatus }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: `Could not update the application.`,
            });
        }
    };


    const isLoading = authLoading || profileLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
                <Loader />
                <p className="text-muted-foreground">Verifying admin status...</p>
            </div>
        );
    }
    
    if (profile?.role !== 'admin') {
        return (
            <main className="flex-1 p-4 md:p-6">
                <div className="container mx-auto max-w-2xl text-center">
                    <Alert variant="destructive">
                        <ShieldOff className="h-4 w-4" />
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>
                            This page is for administrators only.
                        </AlertDescription>
                    </Alert>
                </div>
            </main>
        );
    }

    const pendingApps = applications.filter(a => a.status === 'pending');
    const processedApps = applications.filter(a => a.status !== 'pending');

    return (
        <main className="flex-1 p-4 md:p-6 bg-slate-50">
            <div className="container mx-auto">
                 <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Admin Panel</CardTitle>
                        <CardDescription>Manage volunteer applications and other site settings.</CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Pending Volunteer Applications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loadingApps ? <Loader /> : pendingApps.length === 0 ? (
                                <p className="text-muted-foreground">No pending applications.</p>
                            ) : (
                                pendingApps.map(app => (
                                    <div key={app.id} className="p-4 border rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold">{app.name}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Expertise: {app.expertise}</p>
                                            <p className="text-xs text-muted-foreground font-mono mt-1">User ID: {app.userId}</p>
                                        </div>
                                        <div className="flex gap-2 self-end md:self-center">
                                            <Button size="sm" variant="secondary" onClick={() => handleApplicationStatus(app.id, app.userId, 'rejected')}>Reject</Button>
                                            <Button size="sm" onClick={() => handleApplicationStatus(app.id, app.userId, 'approved')}>Approve</Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                     </Card>

                      <Card>
                        <CardHeader>
                            <CardTitle>Processed Applications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {loadingApps ? <Loader /> : processedApps.length === 0 ? (
                                <p className="text-muted-foreground">No processed applications yet.</p>
                            ) : (
                                processedApps.map(app => (
                                    <div key={app.id} className="p-4 border rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-bold">{app.name}</p>
                                            <p className="text-sm text-muted-foreground">{app.expertise}</p>
                                        </div>
                                        <Badge variant={app.status === 'approved' ? 'default' : 'destructive'} className="capitalize">{app.status}</Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                      </Card>
                </div>
            </div>
        </main>
    )
}
