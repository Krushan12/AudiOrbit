'use client';

import { useParams } from 'next/navigation';
import SessionHost from '@/components/SessionHost';
import SessionClient from '@/components/SessionClient';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

export default function SessionPage() {
  const { sessionId } = useParams();
  const { user } = useSpotifyAuth();

  if (!user) {
    return <p>Loading...</p>; // Show a loader while fetching user info
  }

  return user.isHost ? (
    <SessionHost sessionId={sessionId} />
  ) : (
    <SessionClient sessionId={sessionId} />
  );
}
