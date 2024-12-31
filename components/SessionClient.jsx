import React, { useEffect, useState } from 'react';
import { useSession } from '../hooks/useSession';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { database } from '../lib/firebase';
import { ref, update } from 'firebase/database';

const SessionClient = ({ sessionId }) => {
  const { accessToken } = useSpotifyAuth();
  const session = useSession(sessionId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!session || !accessToken) return;

    const syncWithHost = async () => {
      if (session.currentTrack) {
        const { uri, position, timestamp } = session.currentTrack;
        const timeDiff = Date.now() - timestamp;
        const adjustedPosition = position + timeDiff;

        try {
          await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uris: [uri],
              position_ms: adjustedPosition
            }),
          });
        } catch (error) {
          console.error('Playback sync error:', error);
        }
      }
    };

    syncWithHost();
  }, [session, accessToken]);

  const searchTracks = async (query) => {
    if (!query.trim() || !accessToken) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      setSearchResults(data.tracks.items);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToQueue = async (track) => {
    if (!sessionId || !track) return;
    
    try {
      const queueRef = ref(database, `sessions/${sessionId}/queue`);
      const newTrack = {
        uri: track.uri,
        name: track.name,
        artists: track.artists.map(artist => artist.name),
        albumArt: track.album.images[0]?.url,
        addedAt: Date.now()
      };
      
      await update(ref(database, `sessions/${sessionId}`), {
        queue: [...(session.queue || []), newTrack]
      });
      
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#111111] p-6">
      {session && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Session: {session.name}
            </h1>
            <p className="text-gray-400 mt-2">Host: {session.hostName}</p>
            <p className="text-gray-400">Session Code: {sessionId}</p>
          </div>
          
          {/* Currently Playing */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Now Playing</h2>
            {session.currentTrack ? (
              <div className="flex items-center space-x-4">
                {session.currentTrack.albumArt && (
                  <img 
                    src={session.currentTrack.albumArt} 
                    alt="Album Art"
                    className="w-16 h-16 rounded-md" 
                  />
                )}
                <div>
                  <p className="text-white font-medium">{session.currentTrack.name}</p>
                  <p className="text-gray-400">{session.currentTrack.artists?.join(', ')}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No track currently playing</p>
            )}
          </div>

          {/* Search and Add Songs */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Add Songs to Queue</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    searchTracks(e.target.value);
                  }
                }}
                placeholder="Search for songs..."
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              
              {isSearching && (
                <div className="text-center text-gray-400 py-4">
                  Searching...
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
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
                        className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Queue */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Queue</h2>
            {session.queue && session.queue.length > 0 ? (
              <div className="space-y-3">
                {session.queue.map((track, index) => (
                  <div
                    key={`${track.uri}-${index}`}
                    className="flex items-center space-x-3 bg-gray-700 p-3 rounded-lg"
                  >
                    <img
                      src={track.albumArt}
                      alt=""
                      className="w-10 h-10 rounded"
                    />
                    <div>
                      <p className="text-white">{track.name}</p>
                      <p className="text-gray-400 text-sm">{track.artists.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Queue is empty</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionClient;