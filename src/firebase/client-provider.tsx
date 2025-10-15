'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, onAuthStateChanged, User, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { initializeFirebase } from './index';

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
    const { app, auth, firestore, storage } = initializeFirebase();
    setServices({ app, auth, firestore, storage });
    
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
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
      } finally {
        setLoading(false);
      }
    }
  }, [services.auth]);

  return (
    <FirebaseContext.Provider value={{ ...services, user, loading, signInAnonymously }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
