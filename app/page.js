'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './globals.css';


export default function Home() {
  const router = useRouter();
  const [joinSessionId, setJoinSessionId] = useState('');

  const handleCreateSession = () => {
    router.push('/create');
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (joinSessionId.trim()) {
      router.push(`/session/${joinSessionId}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111]  px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4 pb-4">
          AudiOrbit
        </h1>
        <p className="text-xl text-gray-300">Listen together in perfect harmony</p>
      </div>

      <div className="max-w-md w-full mx-auto space-y-8">
        <button
          onClick={handleCreateSession}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-full transition duration-300"
        >
          Create New Session
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-gray-500">
            <span className="bg-gradient-to-b from-[#0d0d0d] to-[#111111] px-4">or</span>
          </div>
        </div>

        <form onSubmit={handleJoinSession} className="space-y-4">
          <input
            type="text"
            value={joinSessionId}
            onChange={(e) => setJoinSessionId(e.target.value)}
            placeholder="Enter session code"
            className="w-full bg-gray-800 text-white px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-full transition duration-300"
          >
            Join Session
          </button>
        </form>
      </div>
    </main>
  );
}
