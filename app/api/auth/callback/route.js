// app/api/auth/callback/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBaseUrl } from '@/utils/auth';

// Get environment variables with validation
const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const baseUrl = getBaseUrl();
const redirectUri = `${baseUrl}/api/auth/callback`;

export async function GET(request) {
  try {
    // Add debug logging
    console.log('Environment debug:');
    console.log('VERCEL_URL:', process.env.VERCEL_URL);
    console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Calculated base URL:', baseUrl);
    console.log('Final redirect URI:', redirectUri);

    // Validate required environment variables
    if (!clientId || !clientSecret) {
      console.error('Missing required environment variables: NEXT_PUBLIC_SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
      return NextResponse.redirect(new URL('/?error=configuration_error', request.nextUrl.origin));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.nextUrl.origin));
    }

    if (!code) {
      console.error('No authorization code received from Spotify');
      return NextResponse.redirect(new URL('/?error=no_code', request.nextUrl.origin));
    }
    
    console.log(`Processing callback with redirect URI: ${redirectUri}`);

    // Exchange the authorization code for an access token
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { status: response.status, statusText: response.statusText };
      }
      console.error('Token exchange error:', errorData);
      console.error('Redirect URI used:', redirectUri);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      return NextResponse.redirect(new URL(`/?error=token_exchange_failed&status=${response.status}`, request.nextUrl.origin));
    }

    const { access_token, expires_in, refresh_token } = await response.json();
    
    // Set the access token in an HTTP-only cookie
    cookies().set('spotify_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expires_in
    });

    // Set refresh token in HTTP-only cookie
    if (refresh_token) {
      cookies().set('spotify_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    console.log('Successfully exchanged code for tokens, redirecting to dashboard');
    
    // Redirect to dashboard on successful login
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin));
  } catch (error) {
    console.error('Callback error:', error);
    console.error('Error stack:', error.stack);
    const errorMessage = encodeURIComponent(error.message || 'Unknown error');
    return NextResponse.redirect(new URL(`/?error=server_error&message=${errorMessage}`, request.nextUrl.origin));
  }
}