'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [joinSessionId, setJoinSessionId] = useState('');

  const handleCreateSession = () => {
    router.push('/create'); // Redirect to session creation (to be implemented)
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (joinSessionId.trim()) {
      router.push(`/session/${joinSessionId}`);
    }
  };

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-4">Spotify Sync</h1>
        <p className="text-xl text-gray-300">Listen together in perfect harmony</p>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        <button
          onClick={handleCreateSession}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-full transition duration-300"
        >
          Create New Session
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-gray-500">
            <span className="bg-gradient-to-b from-gray-900 to-black px-4">or</span>
          </div>
        </div>

        <form onSubmit={handleJoinSession} className="space-y-4">
          <input
            type="text"
            value={joinSessionId}
            onChange={(e) => setJoinSessionId(e.target.value)}
            placeholder="Enter session code"
            className="w-full bg-gray-800 text-white px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="w-full bg-white hover:bg-gray-100 text-black font-bold py-4 px-6 rounded-full transition duration-300"
          >
            Join Session
          </button>
        </form>
      </div>
    </main>
  );
}
