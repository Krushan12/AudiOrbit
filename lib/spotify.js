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

    const scope = 'streaming user-read-email user-read-private user-modify-playback-state';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state
    });
    
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  },

  exchangeToken: async (code) => {
    console.log('Starting token exchange...');
    
    try {
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Spotify API error:', errorData);
        throw new Error(errorData.error_description || 'Failed to exchange token');
      }

      const data = await tokenResponse.json();
      return data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
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