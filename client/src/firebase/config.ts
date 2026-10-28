import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  type Auth 
} from 'firebase/auth';

export interface FirebaseConfigObject {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// Official Project Configuration
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigObject = {
  apiKey: "AIzaSyBm9z7ZXZs2g7gmpQ_scUNmRmPrRzGEg3M",
  authDomain: "selflearn-83556.firebaseapp.com",
  projectId: "selflearn-83556",
  storageBucket: "selflearn-83556.firebasestorage.app",
  messagingSenderId: "99266551782",
  appId: "1:99266551782:web:d225ead6e8a76572898027",
  measurementId: "G-SJ405XJC3B"
};

// -------------------------------------------------------------
// Read Firebase Config
// -------------------------------------------------------------

export function getActiveFirebaseConfig(): FirebaseConfigObject {
  // 1. Check localStorage first
  const localConfigStr = localStorage.getItem('self_learn_firebase_config');
  if (localConfigStr) {
    try {
      const parsed = JSON.parse(localConfigStr);
      if (parsed.apiKey && parsed.projectId) return parsed;
    } catch {}
  }

  // 2. Check Vite env variables or fallback to official config
  const envConfig: FirebaseConfigObject = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
  };

  return envConfig;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export function initFirebase(cfg?: FirebaseConfigObject | null): { app: FirebaseApp | null; auth: Auth | null } {
  const currentConfig = cfg || getActiveFirebaseConfig();
  if (!currentConfig || !currentConfig.apiKey || !currentConfig.projectId) {
    app = null;
    auth = null;
    googleProvider = null;
    return { app: null, auth: null };
  }

  try {
    app = !getApps().length ? initializeApp(currentConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return { app, auth };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    app = null;
    auth = null;
    googleProvider = null;
    return { app: null, auth: null };
  }
}

// Initial initialization attempt
initFirebase();

export function isFirebaseConfigured(): boolean {
  return Boolean(auth && googleProvider);
}

export async function saveFirebaseConfig(cfg: FirebaseConfigObject): Promise<boolean> {
  localStorage.setItem('self_learn_firebase_config', JSON.stringify(cfg));
  
  // Persist to server config endpoint as well
  try {
    await fetch('/api/config/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
  } catch (err) {
    console.warn('Could not sync firebase config to server file:', err);
  }

  initFirebase(cfg);
  return isFirebaseConfigured();
}

// -------------------------------------------------------------
// Real Firebase Google Sign-In
// -------------------------------------------------------------

export interface FirebaseSignInResult {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  idToken?: string;
}

export async function authSignInWithGoogleFirebase(): Promise<FirebaseSignInResult> {
  if (!auth || !googleProvider) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken();
  return {
    uid: result.user.uid,
    email: result.user.email || '',
    displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Learner',
    photoURL: result.user.photoURL || undefined,
    idToken: token
  };
}

export async function authSendPasswordReset(email: string): Promise<void> {
  if (auth) {
    await sendPasswordResetEmail(auth, email);
    return;
  }
  // If only local backend is active
  throw new Error('Password reset via email requires Firebase Auth to be connected. You can change your password directly in your Profile.');
}
