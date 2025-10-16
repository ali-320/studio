'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
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
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
  storage: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Omit<FirebaseContextType, 'user' | 'loading' | 'signOut'>>({
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
            // Multiple tabs open, persistence can only be enabled
            // in one tab at a a time.
            console.warn("Firestore offline persistence failed: multiple tabs open.");
          } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable persistence
            console.warn("Firestore offline persistence not supported in this browser.");
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
          title: "Connection Failed",
          description: error.message || "Could not connect to Firebase services.",
        })
       setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (services.auth) {
      try {
        await firebaseSignOut(services.auth);
        toast({ title: "Signed Out", description: "You have been successfully signed out." });
      } catch (error) {
        console.error("Sign-out failed", error);
        toast({
          variant: "destructive",
          title: "Sign-Out Failed",
          description: "Could not sign you out. Please try again.",
        })
      }
    }
  }, [services.auth]);

  return (
    <FirebaseContext.Provider value={{ ...services, user, loading, signOut }}>
      {children}
      <FirebaseErrorListener />
      <div id="recaptcha-container"></div>
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
