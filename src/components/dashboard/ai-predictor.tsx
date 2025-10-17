'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, AlertTriangle } from 'lucide-react';
import { useFirebase } from '@/firebase/client-provider';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type Prediction = {
    risk: 'Low' | 'Medium' | 'High';
    score: number;
    reason: string;
    color: string;
};

export function AIPredictor() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [creatingAlert, setCreatingAlert] = useState(false);
    const [prediction, setPrediction] = useState<Prediction | null>(null);

    const handlePrediction = () => {
        setLoading(true);
        setPrediction(null);
        // Simulate AI processing
        setTimeout(() => {
            const risks: Prediction[] = [
                { risk: 'Low', score: 2, reason: 'Current weather data shows minimal rainfall and stable river levels. News reports indicate no immediate threats in the area.', color: 'text-green-600' },
                { risk: 'Medium', score: 5, reason: 'Increased rainfall is expected in the next 24 hours, and river levels are rising slightly. Monitor conditions closely.', color: 'text-yellow-500' },
                { risk: 'High', score: 9, reason: 'Heavy, sustained rainfall is occurring in elevated regions, river levels are approaching flood stage, and news sources report potential for imminent flooding.', color: 'text-red-600' }
            ];
            const randomPrediction = risks[Math.floor(Math.random() * risks.length)];
            setPrediction(randomPrediction);
            setLoading(false);
        }, 1500);
    };

    const handleCreateAlert = async () => {
        if (!firestore || !user || !prediction) return;
        
        setCreatingAlert(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userRef);
            const userData = userDocSnap.data();

            const location = userData?.location || { latitude: 0, longitude: 0 };
            
            const alertData = {
                location: location,
                riskScore: prediction.risk,
                status: 'active',
                timestamp: new Date().toISOString(),
                assignedVolunteer: null,
                resolvedBy: null,
            };

            const alertsCollection = collection(firestore, 'alerts');
            await addDoc(alertsCollection, alertData);

            toast({
                title: "Alert Created",
                description: "The high-risk flood alert has been logged and broadcast.",
            });
        } catch (serverError: any) {
             const permissionError = new FirestorePermissionError({
                path: 'alerts',
                operation: 'create',
                requestResourceData: { risk: prediction.risk },
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Failed to Create Alert',
                description: 'You do not have permission to create alerts.'
            });
        } finally {
            setCreatingAlert(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/> AI Flood Predictor</CardTitle>
                <CardDescription>
                    Get an AI-powered flood risk assessment based on current weather, news, and historical data.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <Button onClick={handlePrediction} disabled={loading} className="w-full md:w-1/2">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Data...
                        </>
                    ) : (
                        'Predict Flood Chance'
                    )}
                </Button>
                {prediction && !loading && (
                    <div className="pt-4 text-left p-4 border rounded-lg bg-card">
                        <h3 className="font-bold text-lg">Prediction Result:</h3>
                        <div className="flex items-baseline gap-2">
                             <p className={`text-3xl font-bold ${prediction.color}`}>{prediction.risk} Risk</p>
                             <p className="text-xl font-semibold text-muted-foreground">(Score: {prediction.score}/10)</p>
                        </div>
                       
                        <p className="text-muted-foreground mt-2"><span className="font-semibold">Reasoning:</span> {prediction.reason}</p>
                        
                        {prediction.risk === 'High' && (
                            <Button 
                                className="w-full mt-4" 
                                variant="destructive"
                                onClick={handleCreateAlert} 
                                disabled={creatingAlert}
                            >
                                {creatingAlert ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Alert...
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Create High-Risk Alert
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
