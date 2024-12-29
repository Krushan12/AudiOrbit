'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSession } from '../hooks/useSession';
import { ref, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { debounce } from 'lodash';

export const SessionHost = ({ sessionId }) => {
  const { accessToken, user } = useSpotifyAuth();
  const session = useSession(sessionId);
  const [player, setPlayer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef(null);

  // Debounced session state update
  const debouncedUpdateState = useCallback(
    debounce(async (state) => {
      if (!sessionId || !user) return;
      
      try {
        await update(ref(database, `sessions/${sessionId}`), {
          currentTrack: {
            uri: state.track_window.current_track.uri,
            position: state.position,
            timestamp: Date.now(),
            name: state.track_window.current_track.name,
            artists: state.track_window.current_track.artists.map(a => a.name),
            albumArt: state.track_window.current_track.album.images[0]?.url
          },
          isPlaying: !state.paused,
          hostName: user.display_name || 'Host',
          lastUpdated: Date.now()
        });
      } catch (err) {
        console.error('Error updating session state:', err);
        setError('Failed to update session state');
      }
    }, 200),
    [sessionId, user]
  );

  // Initialize player
  useEffect(() => {
    let cleanup = () => {};
    
    const initializePlayer = async () => {
      if (!accessToken || !window.Spotify) return;
      
      try {
        setIsLoading(true);
        
        const spotifyPlayer = new window.Spotify.Player({
          name: 'Spotify Sync Session',
          getOAuthToken: cb => cb(accessToken),
          volume: 0.5
        });

        // Set up event listeners
        const eventListeners = {
          ready: ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            setIsReady(true);
            setError(null);
            transferPlayback(device_id);
          },
          not_ready: () => setIsReady(false),
          player_state_changed: state => state && debouncedUpdateState(state),
          initialization_error: ({ message }) => setError(`Init Error: ${message}`),
          authentication_error: ({ message }) => setError(`Auth Error: ${message}`),
          account_error: () => setError('Premium account required'),
          playback_error: ({ message }) => setError(`Playback Error: ${message}`)
        };

        // Add all event listeners
        Object.entries(eventListeners).forEach(([event, callback]) => {
          spotifyPlayer.addListener(event, callback);
        });

        // Connect the player
        const connected = await spotifyPlayer.connect();
        if (!connected) throw new Error('Failed to connect to Spotify');

        setPlayer(spotifyPlayer);
        playerRef.current = spotifyPlayer;
        
        // Cleanup function
        cleanup = () => {
          Object.keys(eventListeners).forEach(event => {
            spotifyPlayer.removeListener(event);
          });
          spotifyPlayer.disconnect();
        };
      } catch (err) {
        console.error('Player initialization error:', err);
        setError('Failed to initialize player');
      } finally {
        setIsLoading(false);
      }
    };

    // Load Spotify SDK if needed
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onload = initializePlayer;
      document.body.appendChild(script);
      cleanup = () => document.body.removeChild(script);
    } else {
      initializePlayer();
    }

    return () => cleanup();
  }, [accessToken, debouncedUpdateState]);

  // Transfer playback to this device
  const transferPlayback = async (deviceId) => {
    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });
    } catch (err) {
      setError('Failed to transfer playback');
    }
  };

  // Playback controls with error handling
  const handlePlayback = async (action) => {
    if (!player) return;
    
    try {
      switch (action) {
        case 'togglePlay':
          const state = await player.getCurrentState();
          await (state?.paused ? player.resume() : player.pause());
          break;
        case 'next':
          await player.nextTrack();
          break;
        case 'previous':
          await player.previousTrack();
          break;
      }
    } catch (err) {
      setError(`Failed to ${action}: ${err.message}`);
    }
  };

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        update(ref(database, `sessions/${sessionId}`), {
          isActive: false,
          endedAt: Date.now()
        }).catch(console.error);
      }
    };
  }, [sessionId]);

  if (isLoading) {
    return <div className="p-4 text-center">Initializing session...</div>;
  }

  return (
    <div className="p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {session && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Host Controls</h1>
            <div className="text-sm">
              Session ID: {sessionId}
              <span className={`ml-2 ${isReady ? 'text-green-500' : 'text-red-500'}`}>●</span>
            </div>
          </div>
          
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => handlePlayback('togglePlay')}
              disabled={!isReady}
              className={`p-4 rounded-full ${
                isReady ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'
              } text-white transition-colors disabled:opacity-50`}
            >
              {session.isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => handlePlayback('previous')}
              disabled={!isReady}
              className={`p-4 rounded-full ${
                isReady ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-300'
              } text-white transition-colors disabled:opacity-50`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePlayback('next')}
              disabled={!isReady}
              className={`p-4 rounded-full ${
                isReady ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-300'
              } text-white transition-colors disabled:opacity-50`}
            >
              Next
            </button>
          </div>
          
          {session.currentTrack && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h2 className="font-semibold">{session.currentTrack.name}</h2>
              <p className="text-gray-600">{session.currentTrack.artists?.join(', ')}</p>
              {session.currentTrack.albumArt && (
                <img 
                  src={session.currentTrack.albumArt} 
                  alt="Album Art"
                  className="w-24 h-24 mt-2 rounded-md" 
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};