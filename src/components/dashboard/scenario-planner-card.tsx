"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BrainCircuit, ShieldAlert } from "lucide-react";

import { getScenarioPrediction } from "@/app/actions";
import type { PredictFloodRiskOutput } from "@/ai/flows/predict-flood-risk";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const scenarioSchema = z.object({
  location: z.string().min(3, "Location is required."),
  scenario: z.string().min(10, "Scenario description must be at least 10 characters."),
});

type ScenarioFormValues = z.infer<typeof scenarioSchema>;

export function ScenarioPlannerCard() {
  const [prediction, setPrediction] = useState<PredictFloodRiskOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      location: "",
      scenario: "",
    },
  });

  async function onSubmit(values: ScenarioFormValues) {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await getScenarioPrediction(values.location, values.scenario);
      setPrediction(result);
    } catch (e) {
      setError("Failed to get scenario prediction. Please try again.");
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
            <BrainCircuit className="h-6 w-6 text-primary" />
            Scenario Planner
        </CardTitle>
        <CardDescription>Create hypothetical scenarios to assess potential flood risks.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Target location for scenario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scenario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 'Heavy rainfall (200mm) in nearby mountains' or 'Upstream dam fails'." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader className="mr-2 h-4 w-4" /> : null}
              Assess Scenario
            </Button>
          </form>
        </Form>
        
        {isLoading && <div className="mt-4 flex justify-center"><Loader /></div>}
        {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}

        {prediction && (
          <div className="mt-6 space-y-4">
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-4">
                <span>Scenario Risk</span>
                <Badge className={cn("text-white", getRiskBadgeVariant(prediction.floodRiskLevel))}>
                  {prediction.floodRiskLevel}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2 text-sm">{prediction.summary}</AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
