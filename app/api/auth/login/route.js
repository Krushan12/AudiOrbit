// app/api/auth/login/route.js
import { NextResponse } from 'next/server';

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback';
// Simplified login route without authentication
export async function GET() {
  const scope = [
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming'
  ].join(' ');

  const authUrl = new URL("https://accounts.spotify.com/authorize")
  authUrl.searchParams.append('client_id',clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', scope);

  return NextResponse.redirect(authUrl.toString())
}