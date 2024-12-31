export default async function handler(req, res) {
    // Get the access token from the cookie
    const accessToken = req.cookies.spotify_access_token;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found' });
    }
    
    res.status(200).json({ accessToken });
  }