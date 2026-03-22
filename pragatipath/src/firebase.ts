import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import localConfig from '../firebase-applet-config.json';

// In production (Render/Vercel): set VITE_FIREBASE_* env vars
// In development: falls back to firebase-applet-config.json
const firebaseConfig = {
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || localConfig.projectId,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || localConfig.appId,
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || localConfig.apiKey,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || localConfig.authDomain,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
};

const firestoreDbId: string =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DB || localConfig.firestoreDatabaseId || '(default)';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDbId);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported');
    }
  });
}

export default app;
