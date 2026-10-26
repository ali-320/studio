'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { analyzeFloodScenario, type ScenarioOutput } from '@/ai/flows/analyze-scenario-flow';

const scenarioSchema = z.object({
    river: z.enum(['low', 'normal', 'high', 'overflowing']),
    rainfall: z.enum(['none', 'light', 'moderate', 'heavy']),
    terrain: z.enum(['flat', 'hilly', 'mountainous', 'urban']),
    extra: z.string().optional(),
});

type ScenarioFormValues = z.infer<typeof scenarioSchema>;

export function ScenarioChecker() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScenarioOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<ScenarioFormValues>({
        resolver: zodResolver(scenarioSchema),
    });

    async function onSubmit(values: ScenarioFormValues) {
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            setResult(await analyzeFloodScenario(values));
        } catch (scenarioError) {
            console.error('Scenario analysis failed:', scenarioError);
            setError('Could not analyze the scenario. Check that the AI key is configured and try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary"/> Scenario Checker</CardTitle>
                <CardDescription>Describe a hypothetical situation to get an AI-based flood risk assessment.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="river" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>River Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select river level..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="low">Low & Calm</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="high">High & Fast</SelectItem>
                                            <SelectItem value="overflowing">Overflowing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="rainfall" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rainfall Intensity</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select rainfall..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">No Rain</SelectItem>
                                            <SelectItem value="light">Light Showers</SelectItem>
                                            <SelectItem value="moderate">Moderate Rain</SelectItem>
                                            <SelectItem value="heavy">Heavy Downpour</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="terrain" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Terrain Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select terrain..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="flat">Flat / Low-lying</SelectItem>
                                            <SelectItem value="hilly">Hilly</SelectItem>
                                            <SelectItem value="mountainous">Mountainous</SelectItem>
                                            <SelectItem value="urban">Urban / Paved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                         <FormField
                            control={form.control}
                            name="extra"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Extra Details</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="e.g., Blocked drainage systems, recent construction..."
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing Scenario...</> : 'Check Scenario'}
                        </Button>
                    </form>
                </Form>
                 {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                 {result && !loading && (
                    <div className="pt-6 mt-4 border-t">
                        <h3 className="font-bold text-lg">Scenario Prediction:</h3>
                        <p className="text-2xl font-bold mt-2">{result.risk} Risk</p>
                        <p className="text-muted-foreground mt-2">{result.assessment}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
