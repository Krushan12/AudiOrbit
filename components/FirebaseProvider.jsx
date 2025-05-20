// components/FirebaseProvider.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { database, auth } from '@/lib/firebase';

const FirebaseContext = createContext({
  database: null,
  auth: null,
  user: null
});

export function FirebaseProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for database initialization in useEffect to avoid hydration mismatch
    if (database && auth) {
      setIsInitialized(true);
      
      // Listen for auth state changes
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
      });

      return () => unsubscribe();
    }
  }, [database, auth]);

  // Don't show loading state immediately to avoid hydration mismatch
  return (
    <FirebaseContext.Provider 
      value={{ 
        database,
        auth,
        user
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};