import { useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';

export const SessionClient = ({ sessionId }) => {
  const { accessToken } = useSpotifyAuth();
  const session = useSession(sessionId);

  useEffect(() => {
    if (!session || !accessToken) return;

    const syncWithHost = async () => {
      if (session.currentTrack) {
        const { uri, position, timestamp } = session.currentTrack;
        const timeDiff = Date.now() - timestamp;
        const adjustedPosition = position + timeDiff;

        try {
          await spotifyApi.play({
            uris: [uri],
            position_ms: adjustedPosition
          });
        } catch (error) {
          console.error('Playback sync error:', error);
        }
      }
    };

    syncWithHost();
  }, [session, accessToken]);

  return (
    <div className="p-4">
      {session && (
        <div className="space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Connected to Session</h1>
            <p className="text-gray-600">Host: {session.hostName}</p>
          </div>
          
          {/* Current track info will go here */}
          <div className="bg-gray-100 p-4 rounded-lg">
            {session.currentTrack && (
              <div className="text-center">
                <p className="font-semibold">Now Playing</p>
                {/* Track details will go here */}
              </div>
            )}
          </div>
          
          {/* Volume control will go here */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Volume
            </label>
            <input
              type="range"
              min="0"
              max="100"
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
