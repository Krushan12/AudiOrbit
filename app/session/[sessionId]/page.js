'use client';

import { useParams } from 'next/navigation';
import SessionHost from '@/components/SessionHost';
import SessionClient from '@/components/SessionClient';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import '../../globals.css';

export default function SessionPage() {
  const { sessionId } = useParams();
  const { user } = useSpotifyAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return user.isHost ? (
    <SessionHost sessionId={sessionId} />
  ) : (
    <SessionClient sessionId={sessionId} />
  );
}