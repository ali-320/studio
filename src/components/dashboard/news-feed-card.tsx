"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Newspaper, Search } from "lucide-react";

import { getNewsAnalysis } from "@/app/actions";
import type { AnalyzeFloodNewsOutput } from "@/ai/flows/analyze-flood-news";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";


const regionSchema = z.object({
  region: z.string().min(3, "Region must be at least 3 characters."),
});

type RegionFormValues = z.infer<typeof regionSchema>;

export function NewsFeedCard() {
  const [analysis, setAnalysis] = useState<AnalyzeFloodNewsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      region: "",
    },
  });

  async function onSubmit(values: RegionFormValues) {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await getNewsAnalysis(values);
      setAnalysis(result);
    } catch (e) {
      setError("Failed to get news analysis. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }
  
  const getRiskBadgeVariant = (riskLevel: string | undefined) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-500 hover:bg-green-600";
      case "moderate":
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
            <Newspaper className="h-6 w-6 text-primary" />
            AI News Feed
        </CardTitle>
        <CardDescription>Scan news and social media for flood-related updates.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Enter a region, e.g., 'Punjab'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="secondary" size="icon" disabled={isLoading}>
              {isLoading ? <Loader className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </Form>
        
        {isLoading && <div className="mt-4 flex justify-center"><Loader /></div>}
        {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}

        {analysis && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <p className="font-semibold">Overall Risk:</p>
                <Badge className={cn("text-white", getRiskBadgeVariant(analysis.riskLevel))}>
                    {analysis.riskLevel}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="space-y-4">
                {analysis.keyInformation.map((info, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-semibold text-primary">{info.source}</p>
                    <p className="text-muted-foreground">{info.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
