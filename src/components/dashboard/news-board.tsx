'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Newspaper, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getNewsForLocation, type NewsItem } from '@/ai/flows/get-news-flow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';

export function NewsBoard({ location }: { location: string | null }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      if (!location) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await getNewsForLocation(location);
        setNews(result.articles);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to fetch news. The AI service may be temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [location]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Newspaper className="h-6 w-6"/> News Board</CardTitle>
        <CardDescription>AI-Sourced updates for your region</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Fetching live news...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="h-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : news.length === 0 ? (
             <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <p>No recent flood-related news found for your area.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {news.map((item, index) => (
                <div key={index}>
                  <div className="text-sm">
                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{item.title}</Link>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.summary}</p>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{item.source}</span>
                    </div>
                  </div>
                  {index < news.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
