import { useEffect } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSession } from '../hooks/useSession';

export const SessionHost = ({ sessionId }) => {
  const { accessToken } = useSpotifyAuth();
  const session = useSession(sessionId);

  useEffect(() => {
    if (!accessToken || !session) return;

    // Initialize Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new Spotify.Player({
        name: 'Spotify Sync Session',
        getOAuthToken: cb => cb(accessToken),
        volume: 1.0
      });

      // Handle player state changes
      player.addListener('player_state_changed', state => {
        if (state) {
          updateSessionState(sessionId, {
            currentTrack: {
              uri: state.track_window.current_track.uri,
              position: state.position,
              timestamp: Date.now()
            },
            isPlaying: !state.paused
          });
        }
      });

      // Connect to the player
      player.connect();
    };
  }, [accessToken, session]);

  return (
    <div className="p-4">
      {session && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Host Controls</h1>
            <div className="text-sm">Session ID: {sessionId}</div>
          </div>
          
          {/* Playback controls will go here */}
          <div className="flex space-x-4 justify-center">
            <button className="p-2 rounded-full bg-green-500 text-white">
              Play/Pause
            </button>
            <button className="p-2 rounded-full bg-gray-500 text-white">
              Previous
            </button>
            <button className="p-2 rounded-full bg-gray-500 text-white">
              Next
            </button>
          </div>
          
          {/* Queue management will go here */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Queue</h2>
            {/* Queue list will go here */}
          </div>
        </div>
      )}
    </div>
  );
};