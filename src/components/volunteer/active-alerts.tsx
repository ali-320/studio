
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertTriangle, BellRing, CheckCircle, HandHelping } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { AssignedAlert } from './assigned-alert';

interface Alert {
    id: string;
    riskScore: 'Low' | 'Medium' | 'High';
    status: 'active' | 'accepted' | 'resolved';
    timestamp: string;
    location: { latitude: number; longitude: number };
    assignedVolunteer?: string;
}

export function ActiveAlerts() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [assignedAlert, setAssignedAlert] = useState<Alert | null>(null);

    useEffect(() => {
        if (!firestore || !user) return;
        setLoading(true);

        const q = query(
            collection(firestore, 'alerts'),
            where('status', 'in', ['active', 'accepted']),
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeAlerts: Alert[] = [];
            let foundAssignedAlert: Alert | null = null;
            
            snapshot.forEach(doc => {
                const data = { id: doc.id, ...doc.data() } as Alert;
                // Check if this volunteer is assigned to this alert
                if (data.assignedVolunteer === user.uid && data.status === 'accepted') {
                    foundAssignedAlert = data;
                } else if(data.status === 'active' && data.riskScore === 'High') {
                    activeAlerts.push(data);
                }
            });
            
            setAssignedAlert(foundAssignedAlert);
            setAlerts(activeAlerts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user]);

    const handleAcceptAlert = async (alertId: string) => {
        if (!firestore || !user) return;

        const alertRef = doc(firestore, 'alerts', alertId);
        const userRef = doc(firestore, 'users', user.uid);
        
        try {
            await updateDoc(alertRef, {
                status: 'accepted',
                assignedVolunteer: user.uid
            });
            await updateDoc(userRef, { status: 'responding' });
            toast({ title: 'Alert Accepted', description: 'You are now responding to this alert.' });
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: alertRef.path,
                operation: 'update',
                requestResourceData: { status: 'accepted', assignedVolunteer: user.uid }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Action Failed', description: 'Could not accept the alert.' });
        }
    };
    
    const handleResolve = () => {
        setAssignedAlert(null); // Clear the assigned alert to show the list again
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-6">
                    <Loader />
                    <p className="ml-2">Searching for active alerts...</p>
                </CardContent>
            </Card>
        );
    }
    
    if (assignedAlert) {
        return <AssignedAlert alert={assignedAlert} onResolve={handleResolve}/>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BellRing /> Active High-Risk Alerts</CardTitle>
                <CardDescription>These are unassigned, high-priority alerts in your area.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {alerts.length === 0 ? (
                    <div className="text-center text-muted-foreground p-6 flex flex-col items-center">
                        <CheckCircle className="h-10 w-10 text-green-500 mb-2"/>
                        <p>No active high-risk alerts. All clear for now.</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className="p-4 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                                <div>
                                    <p className="font-bold">High Risk Alert</p>
                                    <p className="text-sm text-muted-foreground">
                                        Reported at: {new Date(alert.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => handleAcceptAlert(alert.id)}>
                                <HandHelping className="mr-2"/> Accept Alert
                            </Button>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
