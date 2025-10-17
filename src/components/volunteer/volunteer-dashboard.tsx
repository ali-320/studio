
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { VolunteerStatusToggle } from './volunteer-status-toggle';
import { AdminGuidelines } from './admin-guidelines';
import { ActiveAlerts } from './active-alerts';
import { VolunteerChat } from './volunteer-chat';
import { UserProfile } from '@/hooks/use-user-profile';

export function VolunteerDashboard({ profile }: { profile: UserProfile }) {
    return (
         <main className="flex-1 p-4 md:p-6 bg-slate-50">
            <div className="container mx-auto">
                 <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl">Volunteer Panel</CardTitle>
                        <CardDescription>
                            Welcome, {profile.name}. Thank you for your service.
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                        <VolunteerStatusToggle currentStatus={profile.status || 'offline'} />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ActiveAlerts />
                    </div>
                    <div className="space-y-6">
                        <AdminGuidelines />
                        <VolunteerChat />
                    </div>
                </div>
            </div>
         </main>
    );
}
