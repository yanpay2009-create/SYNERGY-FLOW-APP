import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';
const config = firebaseConfig as any;

// Initialize Firebase
const app = initializeApp(config);
export const auth = getAuth(app);

// Set persistence to local for better reliability in sandboxed environments
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Auth persistence failed:", err);
  });
}

// Initialize Firestore with settings for better reliability in sandboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, config.firestoreDatabaseId || '(default)');

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented-browser') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Test connection to Firestore
async function testConnection() {
  if (typeof window !== 'undefined') {
    const quotaTimestamp = localStorage.getItem('synergy_quota_exceeded_timestamp');
    if (quotaTimestamp) {
      const diff = Date.now() - Number(quotaTimestamp);
      if (diff < 24 * 60 * 60 * 1000) {
        console.warn("Skipping connection test: Persistent quota exceeded state active.");
        return;
      }
    }

    const lastTest = Number(localStorage.getItem('synergy_last_connection_test') || 0);
    if (Date.now() - lastTest < 60 * 60 * 1000) { // 1 hour cooldown
      return;
    }
  }

  try {
    // CRITICAL: Call getDocFromServer to test connection as per instructions
    await getDocFromServer(doc(db, 'systemSettings', 'connection_test'));
    if (typeof window !== 'undefined') {
      localStorage.setItem('synergy_last_connection_test', String(Date.now()));
    }
    console.log("Firestore connection successful");
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const isQuotaError = errorMsg.includes('Quota limit exceeded') || errorMsg.includes('quota-exceeded');
    
    if (isQuotaError) {
      const lastLog = (window as any)._lastQuotaErrorLog || 0;
      if (Date.now() - lastLog < 30000) return;
      (window as any)._lastQuotaErrorLog = Date.now();
      console.error("Firebase Connection Error: Quota limit exceeded. Features will be limited.");
    } else if (errorMsg.includes('the client is offline')) {
      console.error("Firebase Connection Error: Please check your Firebase configuration. The client is offline.");
    } else if (errorMsg.includes('permission-denied') || errorMsg.includes('Missing or insufficient permissions')) {
      console.warn("Firestore Connection: Connected, but permission denied for test document (this is normal if rules are strict).");
    } else {
      console.error("Firebase Connection Error:", errorMsg);
    }
  }
}

// testConnection();
testConnection();
