'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/client-provider';
import { doc, getDoc } from 'firebase/firestore';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const { user, firestore, loading: authLoading } = useFirebase();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (firestore) {
        setLoading(true);
        const userRef = doc(firestore, 'users', user.uid);
        getDoc(userRef)
          .then((docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              console.error('No user profile found in Firestore.');
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error fetching user profile:', error);
            setLoading(false);
          });
      }
    }
  }, [user, authLoading, router, firestore]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground mt-2">We couldn't find your profile data.</p>
      </div>
    );
  }
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
  }

  return (
    <main className="flex-1 p-4 md:p-6 bg-slate-50">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <Avatar className="w-24 h-24 text-3xl">
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                </Avatar>
            </div>
            <CardTitle className="text-3xl">{profile.name}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Role</span>
                    <span className="font-semibold capitalize">{profile.role}</span>
                </div>
                 <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs text-muted-foreground">{user?.uid}</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
