
'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { doc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  name: string;
  email: string;
  role: 'registered' | 'volunteer' | 'admin';
  status?: 'available' | 'offline' | 'responding';
}

export function useUserProfile() {
  const { user, firestore, loading: authLoading } = useFirebase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
        setLoading(true);
        return;
    };
    if (!user || !firestore) {
        setLoading(false);
        setProfile(null);
        return;
    };

    setLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          console.error('No user profile found in Firestore.');
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setLoading(false);
        setProfile(null);
      }
    );
    
    return () => unsubscribe();
  }, [user, firestore, authLoading]);

  return { profile, loading };
}
