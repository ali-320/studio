'use client';

import { ReportIncidentCard } from '@/components/report-incident-card';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">Report a Flood Incident</h1>
            <p className="text-muted-foreground">
              Your report can help save lives. Please provide as much detail as possible.
            </p>
          </div>
          <ReportIncidentCard />
        </div>
      </main>
    </div>
  );
}
