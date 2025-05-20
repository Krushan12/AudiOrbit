'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/hooks/useSpotifyAuth';
import Link from 'next/link';
import '../globals.css';

export default function JoinRoom() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push('/');
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    setJoining(true);
    setError('');
    
    try {
      // Here you would validate the room code with your backend
      // For now, we'll just redirect to the room page
      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Invalid room code or room not found');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
          <Link href="/dashboard" className="text-blue-500 hover:text-blue-400 mb-6 inline-block">
            &larr; Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">Join a Listening Room</h1>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleJoinRoom}>
            <div className="mb-6">
              <label htmlFor="roomCode" className="block text-gray-300 mb-2">Room Code</label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 uppercase"
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={joining}
              />
            </div>
            
            <button
              type="submit"
              disabled={joining}
              className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition ${joining ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {joining ? 'Joining Room...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
