import React, { useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';

const SessionClient = ({ sessionId }) => {
  const { accessToken } = useSpotifyAuth();
  const session = useSession(sessionId);

  useEffect(() => {
    if (!session?.currentTrack || !accessToken) return;

    const syncWithHost = async () => {
      try {
        await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [session.currentTrack.uri],
            position_ms: session.currentTrack.position
          }),
        });
      } catch (error) {
        console.error('Playback sync error:', error);
      }
    };

    syncWithHost();
  }, [session?.currentTrack, accessToken]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] flex items-center justify-center">
        <p className="text-white">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            {session.name}
          </h1>
          <p className="text-gray-400 mt-2">Host: {session.hostName}</p>
        </div>

        {session.currentTrack ? (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center space-x-4">
              <img
                src={session.currentTrack.albumArt}
                alt="Album Art"
                className="w-16 h-16 rounded-md"
              />
              <div>
                <p className="text-white font-medium">{session.currentTrack.name}</p>
                <p className="text-gray-400">{session.currentTrack.artists.join(', ')}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-xl text-center">
            <p className="text-gray-400">Waiting for host to play music...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionClient;