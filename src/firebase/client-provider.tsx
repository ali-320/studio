'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, onAuthStateChanged, User, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { initializeFirebase } from './index';
import { toast } from '@/hooks/use-toast';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
  user: User | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
  storage: null,
  user: null,
  loading: true,
  signInAnonymously: async () => {},
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Omit<FirebaseContextType, 'user' | 'loading' | 'signInAnonymously'>>({
    app: null,
    auth: null,
    firestore: null,
    storage: null,
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const { app, auth, firestore, storage } = initializeFirebase();
      setServices({ app, auth, firestore, storage });
      
      if (firestore) {
        enableIndexedDbPersistence(firestore).catch((err) => {
          if (err.code == 'failed-precondition') {
            toast({
              variant: "destructive",
              title: "Offline Mode Failed",
              description: "Multiple tabs open, offline persistence can only be enabled in one tab at a a time.",
            })
          } else if (err.code == 'unimplemented') {
            toast({
              variant: "destructive",
              title: "Offline Mode Not Supported",
              description: "The current browser does not support all of the features required to enable offline persistence.",
            })
          }
        });
      }

      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
          setLoading(false);
      }
    } catch(error: any) {
       console.error("Firebase initialization failed:", error);
       toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "Could not connect to Firebase. Please check your API keys.",
        })
       setLoading(false);
    }
  }, []);

  const signInAnonymously = useCallback(async () => {
    if (services.auth) {
      setLoading(true);
      try {
        await firebaseSignInAnonymously(services.auth);
      } catch (error) {
        console.error("Anonymous sign-in failed", error);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Could not sign you in anonymously. Please check your connection and API keys.",
        })
      } finally {
        setLoading(false);
      }
    }
  }, [services.auth]);

  return (
    <FirebaseContext.Provider value={{ ...services, user, loading, signInAnonymously }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
