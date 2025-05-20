// app/api/auth/callback/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.nextUrl.origin));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.nextUrl.origin));
    }

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
      const errorData = await response.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.nextUrl.origin));
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

    // Redirect to dashboard on successful login
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.nextUrl.origin));
  }
}