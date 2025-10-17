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
import { predictFloodRisk, Prediction } from '@/ai/flows/predict-flood-risk-flow';

const getRiskColor = (risk: 'Low' | 'Medium' | 'High') => {
    switch (risk) {
        case 'Low': return 'text-green-600';
        case 'Medium': return 'text-yellow-500';
        case 'High': return 'text-red-600';
    }
};

export function AIPredictor() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [creatingAlert, setCreatingAlert] = useState(false);
    const [prediction, setPrediction] = useState<Prediction | null>(null);

    const handlePrediction = async () => {
        if (!firestore || !user) return;
        
        setLoading(true);
        setPrediction(null);
        
        try {
            const userRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userRef);

            if (!userDocSnap.exists()) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find user data.' });
                setLoading(false);
                return;
            }
            const userData = userDocSnap.data();
            const locationAddress = userData.currentLocationAddress;
            const locationId = locationAddress ? locationAddress.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : null;

            let newsArticles: any[] = [];
            if (locationId) {
                const newsRef = doc(firestore, 'news', locationId);
                const newsSnap = await getDoc(newsRef);
                if (newsSnap.exists()) {
                    newsArticles = newsSnap.data().articles;
                }
            }
            
            const result = await predictFloodRisk({
                location: locationAddress,
                news: newsArticles.map(a => `${a.title}: ${a.summary}`).join('\n'),
            });
            
            setPrediction(result);

        } catch (error) {
             console.error("AI Prediction failed:", error);
             toast({ variant: 'destructive', title: 'Prediction Failed', description: "The AI service might be unavailable." });
        } finally {
            setLoading(false);
        }
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
                             <p className={`text-3xl font-bold ${getRiskColor(prediction.risk)}`}>{prediction.risk} Risk</p>
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
