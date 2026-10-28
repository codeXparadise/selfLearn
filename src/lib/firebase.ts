import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBm9z7ZXZs2g7gmpQ_scUNmRmPrRzGEg3M",
  authDomain: "selflearn-83556.firebaseapp.com",
  projectId: "selflearn-83556",
  storageBucket: "selflearn-83556.firebasestorage.app",
  messagingSenderId: "99266551782",
  appId: "1:99266551782:web:d225ead6e8a76572898027",
  measurementId: "G-SJ405XJC3B"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

