import SpotifyWebApi from "spotify-web-api-node";
import { saveSessionToFirebase } from "../../../lib/firebase";

export default async function handler(req, res) {
  const code = req.query.code;
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    await saveSessionToFirebase({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: Date.now() + expires_in * 1000,
    });

    res.redirect("/?success=true");
  } catch (error) {
    console.error("Error during Spotify callback:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
