
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Newspaper, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getNewsForLocation, type NewsItem } from '@/ai/flows/get-news-flow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { useFirebase } from '@/firebase/client-provider';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface NewsCache {
  articles: NewsItem[];
  updatedAt: { seconds: number, nanoseconds: number };
}

export function NewsBoard({ location }: { location: string | null }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationId = location ? location.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : null;

  useEffect(() => {
    if (!firestore || !locationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const newsRef = doc(firestore, 'news', locationId);

    const unsubscribe = onSnapshot(newsRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as NewsCache;
          setNews(data.articles);
          setUpdatedAt(new Date(data.updatedAt.seconds * 1000));
          setError(null);
        } else {
          setNews([]);
          setUpdatedAt(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching news from Firestore:", err);
        setError("Could not load news feed. You may not have the required permissions.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, locationId]);

  const handleRefreshNews = async () => {
    if (!location || !locationId || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "Location is not available to fetch news." });
      return;
    }
    setRefreshing(true);
    setError(null);
    try {
      const result = await getNewsForLocation(location);

      if (result.articles && result.articles.length > 0) {
        toast({
          title: "AI News Summary (Debug)",
          description: `Summary of first article: "${result.articles[0].summary}"`,
          duration: 10000,
        });
      } else {
         toast({
          variant: "destructive",
          title: "AI News (Debug)",
          description: "The AI did not return any articles.",
        });
      }

      const newsRef = doc(firestore, 'news', locationId);

      const newsData = {
        articles: result.articles,
        updatedAt: new Date(),
      };
      
      setDoc(newsRef, newsData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
              path: newsRef.path,
              operation: 'write',
              requestResourceData: newsData,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
      
      toast({ title: "News Updated", description: "The news feed has been refreshed." });

    } catch (err: any) {
      console.error("Error refreshing news:", err);
      setError("Failed to refresh news. The AI service may be down or you might lack permissions.");
       toast({
        variant: "destructive",
        title: "Error Refreshing News",
        description: err.message || "An unknown error occurred.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Newspaper className="h-6 w-6"/> News Board</CardTitle>
          <CardDescription>AI-Sourced updates for your region</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshNews} disabled={refreshing || !location}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading news feed...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="h-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : news.length === 0 ? (
             <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <p>No news found. Try refreshing the feed.</p>
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
       {updatedAt && (
        <CardFooter className="text-xs text-muted-foreground pt-3">
          Last updated: {formatDistanceToNow(updatedAt, { addSuffix: true })}
        </CardFooter>
      )}
    </Card>
  );
}
