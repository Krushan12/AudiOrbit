'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/hooks/useSpotifyAuth';
import Link from 'next/link';
import '../../globals.css';

export default function Room({ params }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const audioRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  
  // Search functionality
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [queue, setQueue] = useState([]);
  const searchTimeoutRef = useRef(null);
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const roomCode = unwrappedParams.roomCode;

  // Handle audio ended event for preview playback
  useEffect(() => {
    const handleAudioEnded = () => {
      setIsPlaying(false);
      
      // Play the next track in queue if available
      if (queue.length > 0) {
        const nextTrack = queue[0];
        setCurrentTrack(nextTrack);
        setQueue(queue.slice(1));
        
        if (nextTrack.previewUrl) {
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = nextTrack.previewUrl;
              audioRef.current.load();
              audioRef.current.play();
              setIsPlaying(true);
            }
          }, 0);
        }
      }
    };
    
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener('ended', handleAudioEnded);
    }
    
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [queue]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push('/');
          return;
        }
        setUser(userData);
        
        // Check if user has Spotify Premium (in a real app, you would get this from Spotify API)
        // For now, we'll assume non-premium to show the preview functionality
        setIsPremium(false);
        
        // Check if the user is the host (from URL query param)
        const urlParams = new URLSearchParams(window.location.search);
        const hostParam = urlParams.get('host');
        setIsHost(hostParam === 'true');
        
        // Simulate fetching room data
        // In a real app, you would fetch this from your backend
        setRoomData({
          name: isHost ? 'My Awesome Room' : `${userData.display_name}'s Room`,
          created: new Date().toISOString(),
          code: roomCode
        });
        
        // Simulate participants
        setParticipants([
          {
            id: userData.id,
            name: userData.display_name,
            image: userData.images?.[0]?.url || '/default-avatar.svg',
            isHost: isHost
          },
          // Simulated other participants
          {
            id: 'user2',
            name: 'Music Lover',
            image: '/default-avatar.svg',
            isHost: false
          }
        ]);
        
        // Simulate initial messages
        setMessages([
          {
            id: 1,
            sender: 'System',
            text: `Welcome to the room! Room code: ${roomCode}`,
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            sender: userData.display_name,
            text: 'Just joined the room!',
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, roomCode, isHost]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: user.display_name,
      text: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };
  
  const handlePlayPause = () => {
    if (!currentTrack) return;
    
    if (isPremium) {
      // If premium, would use Spotify Web Playback SDK
      setIsPlaying(!isPlaying);
      // In a real app, you would send this command to your backend
      // which would then sync with all participants
    } else {
      // For non-premium users, use the preview URL
      if (currentTrack.previewUrl) {
        if (isPlaying) {
          audioRef.current?.pause();
        } else {
          audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
      } else {
        alert('Sorry, no preview available for this track');
      }
    }
  };
  
  const handleSkipTrack = () => {
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    
    // Play the next track in queue if available
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setCurrentTrack(nextTrack);
      setQueue(queue.slice(1));
      
      // Add a message to the chat
      const newMessage = {
        id: messages.length + 1,
        sender: 'System',
        text: `${user.display_name} skipped to the next track`,
        timestamp: new Date().toISOString()
      };
      
      setMessages([...messages, newMessage]);
      
      // If it's a non-premium user and we have a preview URL, set up the audio element
      if (!isPremium && nextTrack.previewUrl) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = nextTrack.previewUrl;
            audioRef.current.load();
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 0);
      }
    } else {
      // No more tracks in queue
      setCurrentTrack(null);
    }
  };
  
  const handleAddToQueue = () => {
    setShowSearchModal(true);
  };
  
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Don't block input with setIsSearching(true)
    // Just show a loading indicator if needed
    const searchingId = Date.now();
    setSearchError('');
    
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search');
      }
      
      const data = await response.json();
      setSearchResults(data.tracks);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error.message || 'Failed to search for tracks');
    }
  };
  
  // Handle search input with debounce
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout to perform the search after a delay
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500); // 500ms delay for debouncing
  };
  
  // For form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search term');
      return;
    }
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Perform the search immediately
    await performSearch(searchQuery);
  };
  
  const addTrackToQueue = (track) => {
    // Add track to queue
    setQueue([...queue, track]);
    
    // Add a message to the chat
    const newMessage = {
      id: messages.length + 1,
      sender: user.display_name,
      text: `Added "${track.name}" by ${track.artist} to the queue`,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, newMessage]);
    
    // If no current track is playing, set this as current track
    if (!currentTrack) {
      setCurrentTrack(track);
      
      // If it's a non-premium user and we have a preview URL, set up the audio element
      if (!isPremium && track.previewUrl) {
        // Wait for the audioRef to be available in the next render
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = track.previewUrl;
            audioRef.current.load();
          }
        }, 0);
      }
    }
    
    // Close the modal
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  const handleRemoveFromQueue = (index) => {
    // Create a copy of the queue and remove the track at the specified index
    const newQueue = [...queue];
    const removedTrack = newQueue.splice(index, 1)[0];
    setQueue(newQueue);
    
    // Add a message to the chat
    const newMessage = {
      id: messages.length + 1,
      sender: user.display_name,
      text: `Removed "${removedTrack.name}" from the queue`,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, newMessage]);
  };
  
  const handleLeaveRoom = () => {
    if (isHost && participants.length > 1) {
      if (!confirm('As the host, leaving will end the session for everyone. Are you sure?')) {
        return;
      }
    }
    
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }


  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      {/* Hidden audio element for preview playback */}
      <audio ref={audioRef} />
      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-400">Find Tracks</h2>
              <button 
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchError('');
                }}
                className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition"
              >
                ✕
              </button>
            </div>
            
            {searchError && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4">
                {searchError}
              </div>
            )}
            
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50"
                  placeholder="Search for songs..."
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={isSearching}
                  className={`bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-lg font-medium transition ${isSearching ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map(track => (
                      <div key={track.id} className="flex items-center gap-3 bg-gray-700/70 p-3 rounded-lg hover:bg-gray-600 transition cursor-pointer border border-gray-600 hover:border-green-500/50" onClick={() => addTrackToQueue(track)}>
                        {track.albumArt ? (
                          <img src={track.albumArt} alt={track.album} className="w-14 h-14 rounded-lg shadow-md" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-600 rounded-lg flex items-center justify-center shadow-md">
                            🎵
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white">{track.name}</p>
                          <p className="text-sm text-gray-300 truncate">{track.artist}</p>
                          {track.previewUrl ? (
                            <p className="text-xs text-green-400 mt-1">Preview available</p>
                          ) : (
                            <p className="text-xs text-yellow-400 mt-1">No preview</p>
                          )}
                        </div>
                        <button className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg">
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-300 bg-gray-800/50 rounded-lg border border-gray-700">
                    No results found for "{searchQuery}". Try a different search.
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-300 bg-gray-800/50 rounded-lg border border-gray-700">
                  Start typing to search for tracks
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm p-4 shadow-lg border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-green-400">{roomData?.name || 'Music Room'}</h1>
            <p className="text-sm text-gray-300">Room Code: <span className="font-mono font-medium text-white bg-gray-700 px-2 py-0.5 rounded">{roomCode}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAddToQueue}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <span>Search</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              onClick={handleLeaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Leave Room
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Side - Player and Participants */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          {/* Player */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl border border-gray-700">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-28 h-28 bg-gray-700 rounded-lg flex items-center justify-center shadow-lg overflow-hidden group relative">
                {currentTrack ? (
                  <>
                    <img 
                      src={currentTrack.albumArt} 
                      alt={currentTrack.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={handlePlayPause}
                        className="bg-green-500 hover:bg-green-600 rounded-full p-3 text-xl transition transform hover:scale-110"
                      >
                        {isPlaying ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="text-5xl">🎵</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentTrack ? currentTrack.name : 'No track playing'}
                </h2>
                <p className="text-lg text-gray-300 mb-2">
                  {currentTrack ? currentTrack.artist : 'Search for tracks to get started'}
                </p>
                {!isPremium && currentTrack && (
                  <p className="text-sm px-2 py-1 bg-gray-700 inline-block rounded-full">
                    {currentTrack.previewUrl ? (
                      <span className="text-green-400">30-second preview</span>
                    ) : (
                      <span className="text-yellow-400">No preview available</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            {/* Progress Bar (placeholder) */}
            <div className="mb-6">
              <div className="h-1.5 bg-gray-700 rounded-full w-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: isPlaying ? '35%' : '0%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{isPlaying ? '0:35' : '0:00'}</span>
                <span>1:30</span>
              </div>
            </div>
            
            {/* Player Controls */}
            <div className="flex justify-center items-center gap-6">
              <button 
                className="bg-gray-700 hover:bg-gray-600 rounded-full p-3 transition text-xl"
                onClick={handleSkipTrack}
                disabled={!isHost}
                title="Previous"
              >
                ⏮️
              </button>
              <button 
                className="bg-green-500 hover:bg-green-600 rounded-full p-5 text-2xl transition shadow-lg transform hover:scale-105"
                onClick={handlePlayPause}
                disabled={!isHost || !currentTrack}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button 
                className="bg-gray-700 hover:bg-gray-600 rounded-full p-3 transition text-xl"
                onClick={handleSkipTrack}
                disabled={!isHost}
                title="Next"
              >
                ⏭️
              </button>
            </div>
            
            {!isHost && (
              <p className="text-center text-sm text-gray-400 mt-4">
                Only the host can control playback
              </p>
            )}
          </div>
          
          {/* Queue */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl border border-gray-700 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400">Up Next</h2>
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">{queue.length} tracks</span>
            </div>
            {queue.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                {queue.map((track, index) => (
                  <div key={`${track.id}-${index}`} className="flex items-center gap-3 bg-gray-700/70 p-3 rounded-lg border border-gray-600 hover:border-green-500/30 transition-colors">
                    <span className="text-xs font-mono text-gray-400 bg-gray-800 w-5 h-5 flex items-center justify-center rounded-full">{index + 1}</span>
                    {track.albumArt ? (
                      <img src={track.albumArt} alt={track.album} className="w-12 h-12 rounded-lg shadow-md" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center shadow-md">
                        🎵
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-white">{track.name}</p>
                      <p className="text-sm text-gray-300 truncate">{track.artist}</p>
                      {track.previewUrl ? (
                        <p className="text-xs text-green-400">Preview available</p>
                      ) : (
                        <p className="text-xs text-yellow-400">No preview</p>
                      )}
                    </div>
                    <button 
                      className="text-gray-400 hover:text-red-400 p-2 rounded-full transition bg-gray-800 hover:bg-gray-700"
                      onClick={() => handleRemoveFromQueue(index)}
                      title="Remove from queue"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                <div className="text-5xl mb-3">🎵</div>
                <p className="text-gray-300 mb-2">Your queue is empty</p>
                <p className="text-gray-400 text-sm">Click the Search button to add tracks</p>
              </div>
            )}
          </div>
          
          {/* Participants */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400">Participants</h2>
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">{participants.length} online</span>
            </div>
            <div className="space-y-3">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <div className="relative">
                    <img 
                      src={participant.image} 
                      alt={participant.name} 
                      className="w-10 h-10 rounded-full border-2 border-gray-600"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-800"></span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{participant.name}</p>
                    {participant.isHost ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Host</span>
                    ) : (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Listener</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Side - Chat */}
        <div className="w-full md:w-1/3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700 flex flex-col h-[500px] md:h-auto">
          <div className="p-4 border-b border-gray-700 bg-gray-800/80">
            <h2 className="text-xl font-bold text-green-400">Chat</h2>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className="break-words">
                  {msg.sender === 'System' ? (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-center">
                      <p className="text-sm text-yellow-400">{msg.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-700/70 p-3 rounded-lg border border-gray-600">
                          <p className="text-sm">
                            <span className="font-bold text-green-400">{msg.sender}</span>
                          </p>
                          <p className="text-sm mt-1">{msg.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/80">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50"
                placeholder="Type a message..."
              />
              <button 
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-lg font-medium transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
