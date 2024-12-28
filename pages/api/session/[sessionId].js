import SpotifyWebApi from "spotify-web-api-node";
import { getSessionFromFirebase, updateSessionInFirebase } from "../../../lib/firebase";

export default async function handler(req, res) {
  const { sessionId } = req.query;

  if (req.method === "GET") {
    try {
      const session = await getSessionFromFirebase(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.status(200).json(session);
    } catch (error) {
      console.error("Error syncing session:", error);
      res.status(500).json({ error: "Failed to sync session" });
    }
  } else if (req.method === "POST") {
    const { action } = req.body;

    try {
      const session = await getSessionFromFirebase(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const spotifyApi = new SpotifyWebApi();
      spotifyApi.setAccessToken(session.accessToken);

      switch (action) {
        case "play":
          await spotifyApi.play();
          break;
        case "pause":
          await spotifyApi.pause();
          break;
        case "next":
          await spotifyApi.skipToNext();
          break;
        case "previous":
          await spotifyApi.skipToPrevious();
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      res.status(200).json({ message: "Playback updated" });
    } catch (error) {
      console.error("Error controlling playback:", error);
      res.status(500).json({ error: "Failed to control playback" });
    }
  }
}
