'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // The custom error class already throws itself in a timeout
      // to make it visible in the Next.js dev overlay.
      // We can add other logging or UI notifications here if needed in the future.
      console.log(
        'A detailed Firestore security rule error was caught. See the error overlay for details.'
      );
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null; // This component does not render anything
}
