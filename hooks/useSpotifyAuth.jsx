import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useSpotifyAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for auth cookies first
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (data.accessToken) {
          setAccessToken(data.accessToken);
          
          // Fetch user profile with the token
          const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${data.accessToken}`
            }
          });

          if (!userResponse.ok) {
            throw new Error('Failed to fetch user profile');
          }

          const userData = await userResponse.json();
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = () => {
    router.push('/api/auth/login');
  };

  return { accessToken, user, loading, error, login };
};
