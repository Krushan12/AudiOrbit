import admin from "firebase-admin";

const serviceAccount = require("path/to/serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function saveSessionToFirebase(sessionData) {
  const sessionId = "default-session-id"; // Replace with dynamic session IDs if required
  await db.collection("sessions").doc(sessionId).set(sessionData, { merge: true });
}

export async function getSessionFromFirebase(sessionId) {
  const sessionDoc = await db.collection("sessions").doc(sessionId).get();
  return sessionDoc.exists ? sessionDoc.data() : null;
}

export async function updateSessionInFirebase(sessionId, sessionData) {
  await db.collection("sessions").doc(sessionId).set(sessionData, { merge: true });
}
