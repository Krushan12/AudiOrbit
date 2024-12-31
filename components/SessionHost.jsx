'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSession } from '../hooks/useSession';
import { ref, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { debounce } from 'lodash';

const SessionHost = ({ sessionId }) => {
  const { accessToken, user } = useSpotifyAuth();
  const session = useSession(sessionId);
  const [player, setPlayer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const playerRef = useRef(null);

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
            artists: state.track_window.current_track.artists.map((a) => a.name),
            albumArt: state.track_window.current_track.album.images[0]?.url,
          },
          isPlaying: !state.paused,
          hostName: user.display_name || 'Host',
          lastUpdated: Date.now(),
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
          name: 'AudiOrbit Session',
          getOAuthToken: (cb) => cb(accessToken),
          volume: 0.5,
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
          player_state_changed: (state) => state && debouncedUpdateState(state),
          initialization_error: ({ message }) => setError(`Init Error: ${message}`),
          authentication_error: ({ message }) => setError(`Auth Error: ${message}`),
          account_error: () => setError('Premium account required'),
          playback_error: ({ message }) => setError(`Playback Error: ${message}`),
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

        cleanup = () => {
          Object.keys(eventListeners).forEach((event) => {
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

  const transferPlayback = async (deviceId) => {
    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

  const handlePlayback = async (action) => {
    if (!player) return;

    try {
      switch (action) {
        case 'togglePlay': {
          const state = await player.getCurrentState();
          await (state?.paused ? player.resume() : player.pause());
          break;
        }
        case 'next':
          await player.nextTrack();
          break;
        case 'previous':
          await player.previousTrack();
          break;
        case 'playQueueTrack': {
          if (session?.queue?.length > 0) {
            const nextTrack = session.queue[0];
            await player.play({
              uris: [nextTrack.uri],
            });
            const newQueue = session.queue.slice(1);
            await update(ref(database, `sessions/${sessionId}`), {
              queue: newQueue,
            });
          }
          break;
        }
      }
    } catch (err) {
      setError(`Failed to ${action}: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] flex items-center justify-center">
        <div className="text-white">Initializing session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {session && (
          <>
            <div>
              <button onClick={copySessionCode}>
                {isCopied ? 'Copied!' : 'Copy Session Code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionHost;
