// app/api/auth/login/route.js
import { NextResponse } from 'next/server';

// Get environment variables with validation
const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// For deployed environment, use the actual deployed URL
// This handles both local development and production environments
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const redirectUri = `${baseUrl}/api/auth/callback`;
// Login route with improved error handling
export async function GET(request) {
  try {
    // Validate required environment variables
    if (!clientId) {
      console.error('Missing required environment variable: NEXT_PUBLIC_SPOTIFY_CLIENT_ID');
      return NextResponse.redirect(new URL('/?error=configuration_error', request.nextUrl.origin));
    }

    const scope = [
      'user-read-email',
      'user-read-private',
      'user-library-read',
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming'
    ].join(' ');

    console.log(`Initiating Spotify login with redirect URI: ${redirectUri}`);

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    // Add state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    authUrl.searchParams.append('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = encodeURIComponent(error.message || 'Unknown error');
    return NextResponse.redirect(new URL(`/?error=login_error&message=${errorMessage}`, request.nextUrl.origin));
  }
}