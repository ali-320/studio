'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

export function AIPredictor() {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState<{ risk: string; reason: string; color: string } | null>(null);

    const handlePrediction = () => {
        setLoading(true);
        // Simulate AI processing
        setTimeout(() => {
            setPrediction({
                risk: 'Low',
                reason: 'Current weather data shows minimal rainfall and stable river levels. News reports indicate no immediate threats in the area.',
                color: 'text-green-600'
            });
            setLoading(false);
        }, 1500);
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
                    <div className="pt-4 text-left">
                        <h3 className="font-bold text-lg">Prediction Result:</h3>
                        <p className={`text-3xl font-bold ${prediction.color}`}>{prediction.risk} Risk</p>
                        <p className="text-muted-foreground mt-2"><span className="font-semibold">Reasoning:</span> {prediction.reason}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
