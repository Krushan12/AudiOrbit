'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/hooks/useSpotifyAuth';
import Link from 'next/link';
import '../globals.css';

export default function CreateRoom() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
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

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }
    
    setCreating(true);
    setError('');
    
    try {
      // Here you would integrate with your backend to create a room
      // For now, we'll simulate a successful room creation
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Redirect to the room page with the new room code
      router.push(`/room/${roomCode}?host=true`);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room. Please try again.');
      setCreating(false);
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
          <Link href="/dashboard" className="text-green-500 hover:text-green-400 mb-6 inline-block">
            &larr; Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold mb-6">Create a Listening Room</h1>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleCreateRoom}>
            <div className="mb-4">
              <label htmlFor="roomName" className="block text-gray-300 mb-2">Room Name</label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="My Awesome Room"
                disabled={creating}
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mr-2"
                  disabled={creating}
                />
                <span className="text-gray-300">Private Room (Invite Only)</span>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={creating}
              className={`w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition ${creating ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {creating ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
