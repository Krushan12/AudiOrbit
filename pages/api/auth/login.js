import { spotifyApi } from '../../../lib/spotify';

export default function handler(req, res) {
  try {
    const state = Math.random().toString(36).substring(7);
    const authUrl = spotifyApi.getAuthUrl(state);
    
    // Set the state in a cookie to verify later
    res.setHeader('Set-Cookie', `spotify_auth_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
    
    // Redirect to Spotify auth page
    res.redirect(authUrl);
  } catch (error) {
    console.error('Login handler error:', error.message);
    res.status(500).json({ error: 'Failed to generate auth URL', details: error.message });
  }
}