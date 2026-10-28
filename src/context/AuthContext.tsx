'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import {
  syncUserProfileToFirebase,
  getUserProfileFromFirebase,
} from '@/lib/firebaseDb';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  ollamaApiKey?: string;
  ollamaModel?: string;
  authProvider?: string;
  activityHistory?: any[];
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  needsOllamaOnboarding: boolean;
  setNeedsOllamaOnboarding: (val: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (data: {
    email: string;
    password: string;
    displayName: string;
    ollamaApiKey?: string;
    ollamaModel?: string;
  }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateProfileData: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  needsOllamaOnboarding: false,
  setNeedsOllamaOnboarding: () => {},
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  sendPasswordReset: async () => {},
  resendVerificationEmail: async () => {},
  updateProfileData: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsOllamaOnboarding, setNeedsOllamaOnboarding] = useState<boolean>(false);

  // Initialize session from localStorage or verify with backend
  useEffect(() => {
    const savedToken = localStorage.getItem('self_learn_token');
    if (savedToken) {
      setToken(savedToken);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.success && data.user) {
            const resolvedUid = auth.currentUser?.uid || data.user.googleId || data.user.id;
            let fullUser: User = {
              ...data.user,
              id: resolvedUid,
              emailVerified: auth.currentUser?.emailVerified ?? false,
            };

            // Merge latest from Firestore if available
            try {
              const cloudProfile = await getUserProfileFromFirebase(data.user.id);
              if (cloudProfile) {
                fullUser = {
                  ...fullUser,
                  displayName: cloudProfile.displayName || fullUser.displayName,
                  photoURL: cloudProfile.photoURL || fullUser.photoURL,
                  ollamaApiKey: cloudProfile.ollamaApiKey || fullUser.ollamaApiKey,
                  ollamaModel: cloudProfile.ollamaModel || fullUser.ollamaModel,
                };
              }
            } catch (e) {}

            setUser(fullUser);
            syncUserProfileToFirebase(fullUser);
            if (!fullUser.ollamaApiKey && !sessionStorage.getItem('ollama_onboarding_skipped')) {
              setNeedsOllamaOnboarding(true);
            }
          } else {
            localStorage.removeItem('self_learn_token');
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser && !localStorage.getItem('self_learn_token')) {
        try {
          const res = await fetch('/api/auth/google-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              googleId: fbUser.uid,
            }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            let fullUser: User = {
              ...data.user,
              id: fbUser.uid,
              emailVerified: fbUser.emailVerified,
            };

            const cloudProfile = await getUserProfileFromFirebase(fbUser.uid);
            if (cloudProfile) {
              fullUser = {
                ...fullUser,
                displayName: cloudProfile.displayName || fullUser.displayName,
                photoURL: cloudProfile.photoURL || fullUser.photoURL,
                ollamaApiKey: cloudProfile.ollamaApiKey || fullUser.ollamaApiKey,
                ollamaModel: cloudProfile.ollamaModel || fullUser.ollamaModel,
              };
            }

            setUser(fullUser);
            setToken(data.token);
            localStorage.setItem('self_learn_token', data.token);
            syncUserProfileToFirebase(fullUser);

            if (!fullUser.ollamaApiKey && !sessionStorage.getItem('ollama_onboarding_skipped')) {
              setNeedsOllamaOnboarding(true);
            }
          }
        } catch (e) {
          console.error('Google sync error:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const res = await fetch('/api/auth/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          googleId: fbUser.uid,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      let fullUser: User = {
        ...data.user,
        id: fbUser.uid,
        emailVerified: fbUser.emailVerified,
      };

      const cloudProfile = await getUserProfileFromFirebase(fbUser.uid);
      if (cloudProfile) {
        fullUser = {
          ...fullUser,
          displayName: cloudProfile.displayName || fullUser.displayName,
          photoURL: cloudProfile.photoURL || fullUser.photoURL,
          ollamaApiKey: cloudProfile.ollamaApiKey || fullUser.ollamaApiKey,
          ollamaModel: cloudProfile.ollamaModel || fullUser.ollamaModel,
        };
      }

      setUser(fullUser);
      setToken(data.token);
      localStorage.setItem('self_learn_token', data.token);
      await syncUserProfileToFirebase(fullUser);

      if (!fullUser.ollamaApiKey && !sessionStorage.getItem('ollama_onboarding_skipped')) {
        setNeedsOllamaOnboarding(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      let fbUid = '';
      let fbVerified = false;
      try {
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        fbUid = userCred.user.uid;
        fbVerified = userCred.user.emailVerified;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found') {
          throw new Error('Invalid email or password.');
        }
        if (fbErr.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        }
        console.warn('Firebase client signIn warning:', fbErr.message);
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to login');

      let fullUser: User = {
        ...data.user,
        id: fbUid || data.user.id,
        emailVerified: fbVerified,
      };

      if (fbUid) {
        const cloudProfile = await getUserProfileFromFirebase(fbUid);
        if (cloudProfile) {
          fullUser = {
            ...fullUser,
            displayName: cloudProfile.displayName || fullUser.displayName,
            photoURL: cloudProfile.photoURL || fullUser.photoURL,
            ollamaApiKey: cloudProfile.ollamaApiKey || fullUser.ollamaApiKey,
            ollamaModel: cloudProfile.ollamaModel || fullUser.ollamaModel,
          };
        }
      }

      setUser(fullUser);
      setToken(data.token);
      localStorage.setItem('self_learn_token', data.token);
      await syncUserProfileToFirebase(fullUser);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (form: {
    email: string;
    password: string;
    displayName: string;
    ollamaApiKey?: string;
    ollamaModel?: string;
  }) => {
    setLoading(true);
    try {
      let fbUid = '';
      let fbUser: any = null;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
        fbUser = userCred.user;
        fbUid = userCred.user.uid;
        if (form.displayName) {
          await updateProfile(userCred.user, { displayName: form.displayName });
        }
        // Send email verification
        try {
          await sendEmailVerification(userCred.user);
        } catch (verErr: any) {
          console.warn('sendEmailVerification notice:', verErr.message);
        }
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        if (fbErr.code === 'auth/weak-password') {
          throw new Error('Password must be at least 6 characters.');
        }
        if (fbErr.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        }
        throw new Error(fbErr.message || 'Failed to create Firebase account.');
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: form.email.trim(), firebaseUid: fbUid }),
      });
      const data = await res.json();

      const fullUser: User = {
        id: fbUid || data.user?.id || `usr_${Date.now()}`,
        email: form.email.trim(),
        displayName: form.displayName || form.email.split('@')[0],
        photoURL: data.user?.photoURL || '',
        ollamaApiKey: form.ollamaApiKey || '',
        ollamaModel: form.ollamaModel || 'gemma4:31b',
        emailVerified: fbUser?.emailVerified || false,
      };

      setUser(fullUser);
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('self_learn_token', data.token);
      }
      await syncUserProfileToFirebase(fullUser);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.trim()) {
      throw new Error('Please enter your email address.');
    }
    try {
      await sendPasswordResetEmail(auth, targetEmail.trim());
    } catch (err: any) {
      if (err.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      if (err.code === 'auth/user-not-found') {
        return; // Silent return for security against account enumeration
      }
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('Please sign in first to send a verification email.');
    }
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please wait a few minutes before trying again.');
      }
      throw new Error(err.message || 'Failed to send verification email.');
    }
  };

  const updateProfileData = async (updates: Partial<User>) => {
    if (!token && !user) return;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      const updatedUser = { ...(user || {}), ...(data.user || {}), ...updates } as User;
      setUser(updatedUser);
      await syncUserProfileToFirebase(updatedUser);
    } catch (err: any) {
      if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await syncUserProfileToFirebase(updatedUser);
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    localStorage.removeItem('self_learn_token');
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('self_learn_token') || token;
    if (!savedToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        syncUserProfileToFirebase(data.user);
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        needsOllamaOnboarding,
        setNeedsOllamaOnboarding,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        updateProfileData,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
