import { spotifyApi } from '../../../lib/spotify';

export default async function handler(req, res) {
  // Add debugging
  console.log('Callback received:', {
    code: req.query.code ? 'Present' : 'Missing',
    state: req.query.state,
    error: req.query.error
  });

  const { code, error } = req.query;

  if (error) {
    console.error('Authorization error:', error);
    return res.redirect('/?error=' + encodeURIComponent(error));
  }

  if (!code) {
    console.error('No code received');
    return res.redirect('/?error=no_code');
  }

  try {
    console.log('Exchanging code for token...');
    const data = await spotifyApi.exchangeToken(code);
    
    // Log successful token exchange
    console.log('Token exchange successful:', {
      access_token: data.access_token ? 'Present' : 'Missing',
      refresh_token: data.refresh_token ? 'Present' : 'Missing',
      expires_in: data.expires_in
    });

    // Store tokens in cookies
    res.setHeader('Set-Cookie', [
      `spotify_access_token=${data.access_token}; Path=/; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`,
      `spotify_refresh_token=${data.refresh_token}; Path=/; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    ]);

    // Redirect to home with success
    console.log('Redirecting to homepage...');
    return res.redirect('/?auth=success');
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.redirect('/?error=token_exchange_failed&details=' + encodeURIComponent(error.message));
  }
}
