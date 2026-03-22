import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';
const config = firebaseConfig as any;

// Initialize Firebase
const app = initializeApp(config);
export const auth = getAuth(app);

// Initialize Firestore with settings for better reliability in sandboxed environments
export const db = initializeFirestore(app, {
  // Removing experimentalForceLongPolling as it might be causing 'unavailable' errors in some environments
  // if the backend or proxy doesn't handle it well.
}, config.firestoreDatabaseId || '(default)');

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Test connection to Firestore
async function testConnection() {
  try {
    // CRITICAL: Call getDocFromServer to test connection as per instructions
    // Using 'systemSettings' which has 'allow read: if true' in firestore.rules
    await getDocFromServer(doc(db, 'systemSettings', 'connection_test'));
    console.log("Firestore connection successful");
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('the client is offline')) {
      console.error("Firebase Connection Error: Please check your Firebase configuration. The client is offline.");
    } else if (errorMsg.includes('permission-denied') || errorMsg.includes('Missing or insufficient permissions')) {
      console.warn("Firestore Connection: Connected, but permission denied for test document (this is normal if rules are strict).");
    } else {
      console.error("Firebase Connection Error:", errorMsg);
    }
  }
}

testConnection();
