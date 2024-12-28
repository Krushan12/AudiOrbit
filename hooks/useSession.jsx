import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../lib/firebase';

export const useSession = (sessionId) => {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    return onValue(sessionRef, (snapshot) => {
      setSession(snapshot.val());
    });
  }, [sessionId]);

  return session;
};
