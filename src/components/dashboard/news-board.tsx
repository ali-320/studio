'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Newspaper } from 'lucide-react';
import Link from 'next/link';

const placeholderNews = [
  { id: 1, title: 'Heavy Rains Expected This Weekend, Authorities Issue Warning', source: 'City News', time: '2h ago' },
  { id: 2, title: 'River Levels Rising, Minor Flooding in Low-Lying Areas', source: 'Local Tribune', time: '5h ago' },
  { id: 3, title: 'Volunteer Groups Prepare Sandbags Ahead of Storm', source: 'Community Today', time: '8h ago' },
  { id: 4, title: 'Government Announces New Dam Construction Project', source: 'National Times', time: '1d ago' },
];

export function NewsBoard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Newspaper className="h-6 w-6"/> News Board</CardTitle>
        <CardDescription>Latest updates from your region</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] w-full">
          <div className="space-y-4">
            {placeholderNews.map((item, index) => (
              <div key={item.id}>
                <div className="text-sm">
                  <Link href="#" className="font-semibold hover:underline">{item.title}</Link>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{item.source}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
                {index < placeholderNews.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
