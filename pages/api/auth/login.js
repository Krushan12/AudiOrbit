import { spotifyApi } from '../../../lib/spotify';

export default function handler(req, res) {
  res.redirect(spotifyApi.getAuthUrl());
}
