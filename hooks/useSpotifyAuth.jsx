import { useEffect, useState } from 'react';

export const useSpotifyAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        // Handle the OAuth callback
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (code) {
          // Exchange code for access token
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            body: JSON.stringify({ code }),
          });
          
          const data = await response.json();
          setAccessToken(data.accessToken);
          
          // Fetch user profile
          const userResponse = await spotifyApi.getMe();
          setUser(userResponse.body);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };

    getToken();
  }, []);

  return { accessToken, user };
};
