'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const useSpotifyClient = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const login = () => {
    router.push('/api/auth/login');
  };

  const logout = () => {
    // Clear local state
    setUser(null);
    setAccessToken(null);
    // Redirect to home page
    router.push('/');
  };

  return { 
    accessToken, 
    user, 
    loading, 
    error, 
    login, 
    logout
  };
};
