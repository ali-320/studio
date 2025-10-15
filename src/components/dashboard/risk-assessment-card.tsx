"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, ShieldAlert } from "lucide-react";

import { getFloodPrediction } from "@/app/actions";
import type { PredictFloodRiskOutput } from "@/ai/flows/predict-flood-risk";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const locationSchema = z.object({
  location: z.string().min(3, "Location must be at least 3 characters."),
});

type LocationFormValues = z.infer<typeof locationSchema>;

export function RiskAssessmentCard() {
  const [prediction, setPrediction] = useState<PredictFloodRiskOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      location: "",
    },
  });

  async function onSubmit(values: LocationFormValues) {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await getFloodPrediction(values);
      setPrediction(result);
    } catch (e) {
      setError("Failed to get prediction. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const getRiskBadgeVariant = (riskLevel: string | undefined) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-500 hover:bg-green-600";
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "high":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Flood Risk Assessment
        </CardTitle>
        <CardDescription>Enter your location to get an AI-powered flood risk prediction.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="e.g., 'New Orleans, USA' or 'Karachi, Pakistan'" className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader className="mr-2 h-4 w-4" /> : null}
              Predict Risk
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-6 flex items-center justify-center">
            <Loader />
            <p className="ml-2 text-muted-foreground">Analyzing data...</p>
          </div>
        )}
        
        {error && <Alert variant="destructive" className="mt-6"><AlertDescription>{error}</AlertDescription></Alert>}

        {prediction && (
          <div className="mt-6 space-y-4">
            <Alert className="border-primary/50">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-4 font-headline">
                <span>Risk Level</span>
                <Badge className={cn("text-white", getRiskBadgeVariant(prediction.floodRiskLevel))}>
                  {prediction.floodRiskLevel.charAt(0).toUpperCase() + prediction.floodRiskLevel.slice(1)}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold">Summary</h4>
                  <p className="text-muted-foreground">{prediction.summary}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Recommendations</h4>
                  <p className="text-muted-foreground">{prediction.recommendations}</p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
