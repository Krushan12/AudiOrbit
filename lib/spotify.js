const NEXT_PUBLIC_SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

export const spotifyApi = {
  getAuthUrl: (state) => {
    if (!NEXT_PUBLIC_SPOTIFY_CLIENT_ID) {
      throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not configured');
    }

    if (!REDIRECT_URI) {
      throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
    }

    // Expanded scope for more permissions
    const scope = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-library-read user-library-modify user-read-currently-playing user-read-recently-played';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state,
      show_dialog: 'true' // Always show dialog so user can choose account
    });
    
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  },

  exchangeToken: async (code) => {
    console.log('Starting token exchange...');
    
    try {
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Spotify API error:', errorData);
        throw new Error(errorData.error || 'Failed to exchange token');
      }

      return await tokenResponse.json();
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      return await response.json();
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
};