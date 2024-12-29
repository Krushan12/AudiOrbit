// app/test/page.js
'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import '../globals.css';

export default function TestPage() {
  const [status, setStatus] = useState('');
  const [dbUrl, setDbUrl] = useState('');

  useEffect(() => {
    setDbUrl(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'Not set');
  }, []);

  const testConnection = async () => {
    try {
      if (!database) {
        throw new Error('Database not initialized. Please check your Firebase configuration.');
      }

      // Try to write to a test location
      const testRef = ref(database, 'test/connection');
      await set(testRef, {
        timestamp: Date.now(),
        status: 'connected'
      });

      // Try to read it back
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        setStatus('Database connection successful! Read and write working.');
      } else {
        setStatus('Write successful but read failed.');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Firebase Connection Test</h1>
      <div className="mb-4">
        <p>Database URL: {dbUrl}</p>
      </div>
      <button 
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Connection
      </button>
      {status && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}