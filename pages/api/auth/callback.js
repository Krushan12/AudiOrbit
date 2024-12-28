import { spotifyApi } from '../../../lib/spotify';
import { database } from '../../../lib/firebase';
import { ref, set } from 'firebase/database';

export default async function handler(req, res) {
  const { code } = req.query;

  try {
    const data = await spotifyApi.exchangeToken(code);
    
    // Store tokens in the session
    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      timestamp: Date.now(),
    };

    // You might want to store this in a secure HTTP-only cookie instead
    res.redirect(`/?access_token=${data.access_token}`);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.redirect('/?error=auth_failed');
  }
}