import { database } from '../../../lib/firebase';
import { ref, update, get } from 'firebase/database';

export default async function handler(req, res) {
  const { sessionId } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const snapshot = await get(ref(database, `sessions/${sessionId}`));
        if (snapshot.exists()) {
          res.status(200).json(snapshot.val());
        } else {
          res.status(404).json({ error: 'Session not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch session' });
      }
      break;

    case 'POST':
      try {
        const updates = req.body;
        await update(ref(database, `sessions/${sessionId}`), updates);
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update session' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}