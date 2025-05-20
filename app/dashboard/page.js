'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/hooks/useSpotifyAuth';
import '../globals.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const userData = await getCurrentUser();
        console.log('User data from getCurrentUser:', userData);
        
        if (!userData) {
          console.log('No user data found, redirecting to home');
          router.push('/');
          return;
        }
        
        console.log('Setting user data:', userData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const userName = user?.display_name || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to AudiOrbit{userName ? `, ${userName}` : ''}!</h1>
          <p className="text-xl text-gray-300">What would you like to do today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Room Card */}
          <div 
            className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-green-500/20 transition-all hover:scale-105 cursor-pointer" 
            onClick={() => router.push('/create')}
          >
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold mb-4">Create a Room</h2>
            <p className="text-gray-300 mb-6">Start a new listening session and invite friends to join. Be the DJ and control the music experience.</p>
            <div className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition inline-block">
              Create Room
            </div>
          </div>

          {/* Join Room Card */}
          <div 
            className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-105 cursor-pointer" 
            onClick={() => router.push('/join')}
          >
            <div className="text-5xl mb-4">🎧</div>
            <h2 className="text-2xl font-bold mb-4">Join a Room</h2>
            <p className="text-gray-300 mb-6">Enter a room code to join an existing listening session with friends and enjoy music together.</p>
            <div className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition inline-block">
              Join Room
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400">Want to explore more features?</p>
          <div className="mt-4 flex justify-center space-x-4">
            <Link href="/profile" className="text-green-500 hover:text-green-400 transition">
              View Profile
            </Link>
            <Link href="/history" className="text-green-500 hover:text-green-400 transition">
              Session History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
