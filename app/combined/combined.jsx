
// =====================
// app\combined\combined.jsx
// =====================



// =====================
// components\SessionClient.jsx
// =====================
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



// =====================
// components\SessionHost.jsx
// =====================
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


// =====================
// hooks\useSession.jsx
// =====================
import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../lib/firebase';

export const useSession = (sessionId) => {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    return onValue(sessionRef, (snapshot) => {
      setSession(snapshot.val());
    });
  }, [sessionId]);

  return session;
};



// =====================
// hooks\useSpotifyAuth.jsx
// =====================
import { useEffect, useState } from 'react';

export const useSpotifyAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        // Handle the OAuth callback
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (code) {
          // Exchange code for access token
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            body: JSON.stringify({ code }),
          });
          
          const data = await response.json();
          setAccessToken(data.accessToken);
          
          // Fetch user profile
          const userResponse = await spotifyApi.getMe();
          setUser(userResponse.body);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };

    getToken();
  }, []);

  return { accessToken, user };
};


