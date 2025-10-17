'use client';

import { useEffect } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { AlertTriangle } from 'lucide-react';

export function AlertsDisplay() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    useEffect(() => {
        if (!firestore) return;

        const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);

        const q = query(
            collection(firestore, 'alerts'),
            where('timestamp', '>', fiveMinutesAgo)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const alertData = change.doc.data();
                    toast({
                        variant: 'destructive',
                        title: `New Flood Alert: ${alertData.riskScore} Risk`,
                        description: `A new ${alertData.riskScore.toLowerCase()} risk alert has been reported in your area.`,
                        duration: 10000,
                        action: (
                            <div className="p-2 bg-destructive-foreground/20 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
                            </div>
                        )
                    });
                }
            });
        });

        return () => unsubscribe();
    }, [firestore, toast]);

    return null; // This component does not render anything visible
}
