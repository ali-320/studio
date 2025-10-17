
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase/client-provider';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Alert {
    id: string;
    riskScore: 'Low' | 'Medium' | 'High';
    status: 'active' | 'accepted' | 'resolved';
    timestamp: string;
    location: { latitude: number; longitude: number };
}

interface AssignedAlertProps {
    alert: Alert;
    onResolve: () => void;
}

const reportSchema = z.object({
    casualties: z.coerce.number().min(0).default(0),
    injuries: z.coerce.number().min(0).default(0),
    safetyStatus: z.string().min(5, { message: "Please describe the safety status." }),
    lossEstimate: z.coerce.number().min(0).default(0),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function AssignedAlert({ alert, onResolve }: AssignedAlertProps) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            casualties: 0,
            injuries: 0,
            safetyStatus: '',
            lossEstimate: 0
        },
    });

    const onSubmit = async (values: ReportFormValues) => {
        if (!firestore || !user) return;
        setIsSubmitting(true);

        const reportData = {
            alertId: alert.id,
            volunteerId: user.uid,
            timestamp: new Date().toISOString(),
            ...values,
        };

        const alertRef = doc(firestore, 'alerts', alert.id);
        const userRef = doc(firestore, 'users', user.uid);
        
        try {
            // Submit the report
            await addDoc(collection(firestore, 'incidentReports'), reportData);
            
            // Resolve the alert
            await updateDoc(alertRef, { status: 'resolved', resolvedBy: user.uid });
            
            // Set volunteer status back to available
            await updateDoc(userRef, { status: 'available' });

            toast({ title: "Report Submitted", description: "The incident has been marked as resolved." });
            onResolve(); // Notify parent to refresh the alert list

        } catch (serverError: any) {
            const path = serverError.message.includes('incidentReports') ? 'incidentReports' : 'alerts';
            const permissionError = new FirestorePermissionError({
                path: path,
                operation: 'write',
                requestResourceData: reportData
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your report." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
                <CardTitle>Responding to Alert</CardTitle>
                <CardDescription>You are assigned to a high-risk alert. Please file your report below once the situation is handled.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="casualties" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Casualties</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="injuries" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Injuries</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="lossEstimate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Est. Loss (USD)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="safetyStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Overall Safety Status</FormLabel>
                                <FormControl><Textarea placeholder="Describe the current situation, remaining risks, and needs..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting Report...</>
                            ) : (
                                <><Send className="mr-2"/>Submit Final Report & Resolve Alert</>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
