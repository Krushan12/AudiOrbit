// components/FirebaseProvider.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { database } from '@/lib/firebase';

const FirebaseContext = createContext(null);

export function FirebaseProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check for database initialization in useEffect to avoid hydration mismatch
    if (database) {
      setIsInitialized(true);
    }
  }, []);

  // Don't show loading state immediately to avoid hydration mismatch
  return (
    <FirebaseContext.Provider value={{ database }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};