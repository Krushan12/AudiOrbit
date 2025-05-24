export function getBaseUrl() {
  // For server-side (API routes)
  if (typeof window === 'undefined') {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
  
  // For client-side - use window.location.origin or fallback
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export function generateSpotifyAuthUrl(state) {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = `${getBaseUrl()}/api/auth/callback`;
  const scopes = 'user-read-playback-state user-modify-playback-state streaming';
  
  console.log('Generating Spotify auth URL with redirect URI:', redirectUri);
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state: state || Math.random().toString(36).substring(7)
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}
