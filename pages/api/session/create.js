import { database } from '../../../lib/firebase';
import { ref, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hostName, userId } = req.body;
    const sessionId = uuidv4();

    await set(ref(database, `sessions/${sessionId}`), {
      hostName,
      hostId: userId,
      createdAt: Date.now(),
      currentTrack: null,
      isPlaying: false,
      queue: [],
    });

    res.status(200).json({ sessionId });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
}