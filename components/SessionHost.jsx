"use client";
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

  const playNextTrack = async () => {
    if (!session?.queue?.length || !player || !accessToken) return;

    try {
      const nextTrack = session.queue[0];
      
      // Update the session first
      await update(ref(database, `sessions/${sessionId}`), {
        currentTrack: {
          ...nextTrack,
          position: 0,
          timestamp: Date.now(),
        },
        queue: session.queue.slice(1),
        isPlaying: true,
      });

      // Then play the track
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [nextTrack.uri],
        }),
      });
    } catch (err) {
      console.error('Error playing next track:', err);
      setError('Failed to play next track');
    }
  };

  // Effect to monitor queue changes
  useEffect(() => {
    if (!session?.currentTrack && session?.queue?.length > 0) {
      playNextTrack();
    }
  }, [session?.queue]);

  // Effect to monitor track completion
  useEffect(() => {
    const checkTrackCompletion = async () => {
      if (!player) return;
      
      const state = await player.getCurrentState();
      if (state?.position === 0 && state?.paused && session?.queue?.length > 0) {
        playNextTrack();
      }
    };

    const interval = setInterval(checkTrackCompletion, 1000);
    return () => clearInterval(interval);
  }, [player, session?.queue]);

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

        Object.entries(eventListeners).forEach(([event, callback]) => {
          spotifyPlayer.addListener(event, callback);
        });

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
          await playNextTrack();
          break;
        case 'previous':
          await player.previousTrack();
          break;
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
              <button 
                onClick={copySessionCode}
                className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
              >
                {isCopied ? 'Copied!' : 'Copy Session Code'}
              </button>
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => handlePlayback('previous')}
                className="bg-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={() => handlePlayback('togglePlay')}
                className="bg-orange-500 text-white px-8 py-3 rounded-full hover:bg-orange-600"
              >
                {session.isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={() => handlePlayback('next')}
                className="bg-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionHost;
