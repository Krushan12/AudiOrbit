// app/api/spotify/search/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }
    
    // Get the access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Search tracks on Spotify
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Spotify search error:', errorData);
      return NextResponse.json({ error: 'Failed to search Spotify' }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Format the response to only include the data we need
    const tracks = data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url,
      duration: track.duration_ms,
      uri: track.uri,
      previewUrl: track.preview_url // Include the preview URL for 30-second clips
    }));
    
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
