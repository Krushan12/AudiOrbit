"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { ref, update, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { debounce } from 'lodash';

const SessionHost = ({ sessionId }) => {
  const { accessToken, user } = useSpotifyAuth();
  const [player, setPlayer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [initializationTimeout, setInitializationTimeout] = useState(null);

  // Generate join code and initialize session
  useEffect(() => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setJoinCode(code);
    
    // Initialize session in Firebase
    update(ref(database, `sessions/${sessionId}`), {
      joinCode: code,
      hostName: user?.display_name || 'Host',
      hostId: user?.id, // Make sure this is stored
      createdAt: Date.now(),
      status: 'active'
    });
    console.log('Session initialized with host ID:', user?.id);

    // Listen for queue changes
    const queueRef = ref(database, `sessions/${sessionId}/queue`);
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setQueue(Object.values(data));
      } else {
        setQueue([]);
      }
    });

    return () => unsubscribe();
  }, [sessionId, user]);

  const debouncedUpdateState = useCallback(
    debounce(async (state) => {
      if (!sessionId || !state) return;
      try {
        const track = state.track_window.current_track;
        const currentTrackData = {
          uri: track.uri,
          name: track.name,
          artists: track.artists.map(artist => artist.name),
          albumArt: track.album.images[0]?.url,
          duration: track.duration_ms,
          position: state.position
        };
        
        setCurrentTrack(currentTrackData);
        setIsPlaying(!state.paused);
        
        await update(ref(database, `sessions/${sessionId}`), {
          currentTrack: currentTrackData,
          isPlaying: !state.paused,
          updatedAt: Date.now()
        });
      } catch (err) {
        console.error('Error updating playback state:', err);
      }
    }, 200),
    [sessionId]
  );

  useEffect(() => {
    if (!accessToken) {
      console.log('No access token, cannot initialize player');
      return;
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.error('Player initialization timed out');
        setError('Player initialization timed out. Please refresh the page or check if Spotify is available.');
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout

    setInitializationTimeout(timeout);

    // Setup Spotify SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'AudiOrbit Session',
        getOAuthToken: cb => {
          console.log('Getting OAuth token');
          cb(accessToken);
        },
        volume: 0.5
      });

      console.log('Spotify player created');

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setIsReady(true);
        transferPlayback(device_id);
        clearTimeout(timeout);
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        console.log('Player state changed:', state);
        debouncedUpdateState(state);
      });
      
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });
      
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
        setError(`Initialization error: ${message}`);
        setIsLoading(false);
        clearTimeout(timeout);
      });
      
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        setError(`Authentication error: ${message}`);
        setIsLoading(false);
        clearTimeout(timeout);
      });
      
      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        setError(`Account error: ${message}. Do you have Spotify Premium?`);
        setIsLoading(false);
        clearTimeout(timeout);
      });

      console.log('Connecting to Spotify...');
      spotifyPlayer.connect()
        .then(success => {
          if (success) {
            console.log('Connected to Spotify!');
            setPlayer(spotifyPlayer);
            setIsLoading(false);
            clearTimeout(timeout);
          } else {
            console.error('Failed to connect to Spotify');
            setError('Failed to connect to Spotify player');
            setIsLoading(false);
            clearTimeout(timeout);
          }
        })
        .catch(err => {
          console.error('Error connecting to Spotify:', err);
          setError(`Connection error: ${err.message}`);
          setIsLoading(false);
          clearTimeout(timeout);
        });
    };

    // Load the Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Spotify Web Playback SDK');
      setError('Failed to load Spotify player. Please check your internet connection and try again.');
      setIsLoading(false);
      clearTimeout(timeout);
    };
    document.body.appendChild(script);

    return () => {
      if (player) {
        player.disconnect();
      }
      document.body.removeChild(script);
      clearTimeout(timeout);
    };
  }, [accessToken]);

  const transferPlayback = async (deviceId) => {
    console.log('Transferring playback to device:', deviceId);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Transfer playback failed:', response.status, errorData);
        setError(`Failed to transfer playback: ${response.status}`);
        return;
      }
      
      console.log('Playback transferred successfully');
    } catch (err) {
      console.error('Transfer playback error:', err);
      setError('Failed to transfer playback: ' + err.message);
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
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data.tracks.items);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed: ' + err.message);
    }
  };

  const addToQueue = async (track) => {
    if (!track) return;
    
    try {
      const newQueueItem = {
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists: track.artists.map(artist => artist.name),
        albumArt: track.album.images[0]?.url,
        duration: track.duration_ms,
        addedBy: user?.display_name || 'Host',
        addedAt: Date.now()
      };

      // Add to Firebase queue
      const newQueueRef = ref(database, `sessions/${sessionId}/queue/${track.id}`);
      await update(newQueueRef, newQueueItem);

      // If this is the first track, play it immediately
      if (queue.length === 0) {
        await playTrack(track);
      }

      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setError('Failed to add track to queue: ' + err.message);
    }
  };

  const playTrack = async (track) => {
    if (!player || !track) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [track.uri]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Play track failed:', response.status, errorData);
        throw new Error(`Play failed: ${response.status}`);
      }
      
      // Update current track index
      const trackIndex = queue.findIndex(t => t.id === track.id);
      if (trackIndex !== -1) {
        setCurrentTrackIndex(trackIndex);
      }
    } catch (err) {
      setError('Failed to play track: ' + err.message);
    }
  };

  const playNext = async () => {
    if (currentTrackIndex >= queue.length - 1) return;
    const nextTrack = queue[currentTrackIndex + 1];
    await playTrack(nextTrack);
  };

  const playPrevious = async () => {
    if (currentTrackIndex <= 0) return;
    const prevTrack = queue[currentTrackIndex - 1];
    await playTrack(prevTrack);
  };

  const togglePlayback = async () => {
    if (!player) return;
    try {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.resume();
      }
    } catch (err) {
      setError('Failed to toggle playback: ' + err.message);
    }
  };

  const removeFromQueue = async (trackId) => {
    try {
      await update(ref(database, `sessions/${sessionId}/queue/${trackId}`), null);
    } catch (err) {
      setError('Failed to remove track: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] flex items-center justify-center flex-col">
        <div className="text-white mb-4">Initializing player...</div>
        <div className="text-gray-400 text-sm">
          Make sure you have an active Spotify premium account
        </div>
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

        {/* Join Code Section */}
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl text-center">
          <h3 className="text-gray-400 mb-2">Share this code to join</h3>
          <div className="text-4xl font-bold text-orange-500">{joinCode}</div>
          <p className="text-gray-500 text-sm mt-2">
            Others can enter this code at audi-orbit.vercel.app/join
          </p>
        </div>

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
                  className="flex items-center justify-between bg-gray-700 p-3 rounded-lg hover:bg-gray-600"
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
                  <button
                    onClick={() => addToQueue(track)}
                    className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm hover:bg-orange-600"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Now Playing Section */}
        {currentTrack && (
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-white font-medium mb-4">Now Playing</h3>
            <div className="flex items-center space-x-4">
              <img
                src={currentTrack.albumArt}
                alt="Album Art"
                className="w-16 h-16 rounded-md"
              />
              <div className="flex-1">
                <p className="text-white font-medium">{currentTrack.name}</p>
                <p className="text-gray-400">{currentTrack.artists.join(', ')}</p>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-orange-500 h-1.5 rounded-full" 
                    style={{ 
                      width: `${(currentTrack.position / currentTrack.duration) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={playPrevious}
                  disabled={currentTrackIndex <= 0}
                  className="bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                  </svg>
                </button>
                <button
                  onClick={togglePlayback}
                  className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600"
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={playNext}
                  disabled={currentTrackIndex >= queue.length - 1}
                  className="bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Queue Section */}
        {queue.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-white font-medium mb-4">Queue ({queue.length})</h3>
            <div className="space-y-2">
              {queue.map((track, index) => (
                <div 
                  key={track.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${index === currentTrackIndex ? 'bg-orange-500/20' : 'bg-gray-700'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 w-5">{index + 1}</span>
                    <img
                      src={track.albumArt}
                      alt=""
                      className="w-10 h-10 rounded"
                    />
                    <div>
                      <p className={`${index === currentTrackIndex ? 'text-orange-500' : 'text-white'}`}>
                        {track.name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {track.artists.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {index === currentTrackIndex ? (
                      <span className="text-orange-500 text-sm">Now Playing</span>
                    ) : (
                      <>
                        <button
                          onClick={() => playTrack(track)}
                          className="text-gray-300 hover:text-white"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeFromQueue(track.id)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHost;