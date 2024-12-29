'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

export default function CreateSession() {
  const router = useRouter();
  const { accessToken, user } = useSpotifyAuth();
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to Spotify login if not authenticated
  useEffect(() => {
    if (!accessToken && !isLoading) {
      router.push('/api/auth/login');
    }
  }, [accessToken, isLoading, router]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    if (!accessToken) {
      setError('Please login with Spotify first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check database connection
      if (!database) {
        throw new Error('Database connection not established');
      }

      // Generate a unique session ID
      const sessionId = uuidv4();

      // Create the session in Firebase
      const sessionRef = ref(database, `sessions/${sessionId}`);
      await set(sessionRef, {
        name: sessionName,
        description: sessionDescription,
        createdAt: Date.now(),
        hostId: user?.id,
        hostName: user?.display_name || 'Anonymous',
        currentTrack: null,
        isPlaying: false,
        queue: [],
        active: true
      });

      // Redirect to the session page
      router.push(`/session/${sessionId}`);
    } catch (err) {
      console.error('Error creating session:', err);
      setError(
        err.message === 'Database connection not established'
          ? 'Database connection failed. Please try again.'
          : 'Failed to create session. Please try again.'
      );
      setIsLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Please login with Spotify to create a session</p>
          <button
            onClick={() => router.push('/api/auth/login')}
            className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition-colors"
          >
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-6">
            Create New Session
          </h1>
          <p className="text-lg text-gray-300 max-w-lg mx-auto leading-relaxed">
            Set up your own session to listen to music with your friends on Spotify!
          </p>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateSession} className="space-y-6">
          <div>
            <label htmlFor="sessionName" className="block text-white font-semibold mb-2">
              Session Name
            </label>
            <input
              type="text"
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
              className="w-full bg-gray-800 text-white px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              required
            />
          </div>

          <div>
            <label htmlFor="sessionDescription" className="block text-white font-semibold mb-2">
              Session Description (optional)
            </label>
            <textarea
              id="sessionDescription"
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              placeholder="Enter a description for the session"
              rows="4"
              className="w-full bg-gray-800 text-white px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-semibold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? 'Creating Session...' : 'Create Session'}
          </button>
        </form>
      </div>
    </main>
  );
}