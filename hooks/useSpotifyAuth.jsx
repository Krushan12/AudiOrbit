'use server';
import { cookies } from 'next/headers';

export async function getCurrentUser() {
  console.log('Getting cookies...');
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  console.log('Access token from cookies:', accessToken ? '***token exists***' : 'no token found');

  if (!accessToken) {
    console.log('No access token found');
    return null;
  }

  try {
    console.log('Fetching user data from Spotify API...');
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error fetching user data:', response.status, response.statusText);
      return null;
    }

    const userData = await response.json();
    console.log('Successfully fetched user data:', userData);
    return userData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
}