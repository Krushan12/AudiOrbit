"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { ref, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { debounce } from 'lodash';

const SessionHost = ({ sessionId }) => {
  const { accessToken } = useSpotifyAuth();
  const [player, setPlayer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const debouncedUpdateState = useCallback(
    debounce(async (state) => {
      if (!sessionId || !state) return;
      try {
        const track = state.track_window.current_track;
        setCurrentTrack({
          uri: track.uri,
          name: track.name,
          artists: track.artists.map(artist => artist.name),
          albumArt: track.album.images[0]?.url
        });
        setIsPlaying(!state.paused);
        
        await update(ref(database, `sessions/${sessionId}`), {
          currentTrack: {
            uri: track.uri,
            name: track.name,
            artists: track.artists.map(artist => artist.name),
            albumArt: track.album.images[0]?.url,
            position: state.position,
            timestamp: Date.now()
          },
          isPlaying: !state.paused
        });
      } catch (err) {
        console.error('Error updating playback state:', err);
      }
    }, 200),
    [sessionId]
  );

  useEffect(() => {
    if (!accessToken || !window.Spotify) return;

    const initializePlayer = async () => {
      try {
        const spotifyPlayer = new window.Spotify.Player({
          name: 'AudiOrbit Session',
          getOAuthToken: cb => cb(accessToken),
          volume: 0.5
        });

        spotifyPlayer.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setIsReady(true);
          transferPlayback(device_id);
        });

        spotifyPlayer.addListener('player_state_changed', debouncedUpdateState);
        spotifyPlayer.addListener('not_ready', () => setIsReady(false));

        await spotifyPlayer.connect();
        setPlayer(spotifyPlayer);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize player');
        setIsLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onload = initializePlayer;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      player?.disconnect();
    };
  }, [accessToken]);

  const transferPlayback = async (deviceId) => {
    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      });
    } catch (err) {
      setError('Failed to transfer playback');
    }
  };

  const searchTracks = async (query) => {
    if (!query.trim() || !accessToken) return;
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      setSearchResults(data.tracks.items);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const playTrack = async (track) => {
    if (!player || !track) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [track.uri]
        })
      });
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setError('Failed to play track');
    }
  };

  const togglePlayback = async () => {
    if (!player) return;
    const state = await player.getCurrentState();
    if (state?.paused) {
      await player.resume();
    } else {
      await player.pause();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchTracks(e.target.value);
            }}
            placeholder="Search for a song..."
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600"
                  onClick={() => playTrack(track)}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={track.album.images[2]?.url}
                      alt=""
                      className="w-10 h-10 rounded"
                    />
                    <div>
                      <p className="text-white">{track.name}</p>
                      <p className="text-gray-400 text-sm">
                        {track.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player Section */}
        {currentTrack && (
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="flex items-center space-x-4">
              <img
                src={currentTrack.albumArt}
                alt="Album Art"
                className="w-16 h-16 rounded-md"
              />
              <div className="flex-1">
                <p className="text-white font-medium">{currentTrack.name}</p>
                <p className="text-gray-400">{currentTrack.artists.join(', ')}</p>
              </div>
              <button
                onClick={togglePlayback}
                className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHost;