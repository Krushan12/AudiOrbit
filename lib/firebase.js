// lib/firebase.js
'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

// Import config from separate file
import { firebaseConfig } from './firebase-config';

// Use the imported config directly
const config = firebaseConfig;

// Initialize Firebase
let app;
let database;
let auth;

if (typeof window !== 'undefined') {
  try {
    // Debug log
    console.log('Firebase Config:', {
      ...config,
      apiKey: 'HIDDEN' // Don't log the actual API key
    });

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    
    // Initialize database with URL explicitly
    database = getDatabase(app, config.databaseURL);
    auth = getAuth(app);
    
    // Test database connection
    const testRef = ref(database, 'test_connection');
    set(testRef, { timestamp: Date.now() })
      .then(() => {
        console.log('Firebase database connection test successful');
      })
      .catch((error) => {
        console.error('Firebase database connection test failed:', error);
        throw error;
      });
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export { app, database, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };