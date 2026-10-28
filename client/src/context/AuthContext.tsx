import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  isFirebaseConfigured, 
  authSignInWithGoogleFirebase,
  initFirebase
} from '../firebase/config';
import type { UserProfile, ActivityItem } from '../types';

export interface AuthUser {
  id?: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authProvider?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isGuest: boolean;
  profile: UserProfile | null;
  token: string | null;
  usageCount: number;
  maxDailyQueries: number;
  incrementUsage: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, ollamaKey?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfileDetails: (name: string, photoURL?: string) => Promise<void>;
  updatePasswordAction: (pass: string) => Promise<void>;
  saveOllamaConfig: (key: string, model?: string, host?: string) => void;
  recordActivity: (item: Omit<ActivityItem, 'id' | 'watchedAt'>) => void;
  setGuestMode: (flag: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('self_learn_token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('self_learn_guest_mode') === 'true';
  });

  const [usageCount, setUsageCount] = useState<number>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(`self_learn_usage_${today}`);
    return stored ? parseInt(stored, 10) : 0;
  });

  const maxDailyQueries = 50;

  const incrementUsage = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem(`self_learn_usage_${today}`, newCount.toString());
  };

  // Convert raw DB user to client UserProfile and AuthUser
  const syncUserFromDb = (dbUser: any) => {
    const authUser: AuthUser = {
      id: dbUser.id,
      uid: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName,
      photoURL: dbUser.photoURL || null,
      authProvider: dbUser.authProvider
    };

    const userProf: UserProfile = {
      id: dbUser.id,
      uid: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName,
      photoURL: dbUser.photoURL,
      createdAt: dbUser.createdAt,
      ollamaApiKey: dbUser.ollamaApiKey || '',
      ollamaModel: dbUser.ollamaModel || 'gemma4:31b',
      ollamaHost: dbUser.ollamaHost || 'https://ollama.com',
      activityHistory: dbUser.activityHistory || []
    };

    setUser(authUser);
    setProfile(userProf);

    // Sync AI preferences to localStorage for immediate offline access
    if (dbUser.ollamaApiKey) localStorage.setItem('self_learn_ai_key', dbUser.ollamaApiKey);
    if (dbUser.ollamaModel) localStorage.setItem('self_learn_ai_model', dbUser.ollamaModel);
    if (dbUser.ollamaHost) localStorage.setItem('self_learn_ai_host', dbUser.ollamaHost);
  };

  // Check initial authentication and fetch profile
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check if server has Firebase config
      try {
        const fbRes = await fetch('/api/config/firebase');
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          if (fbData.isConfigured && fbData.config) {
            initFirebase(fbData.config);
          }
        }
      } catch (e) {
        console.warn('Could not check server Firebase config:', e);
      }

      // 2. Check stored session token
      const currentToken = localStorage.getItem('self_learn_token');
      if (!currentToken) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            syncUserFromDb(data.user);
          } else {
            localStorage.removeItem('self_learn_token');
            setToken(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          localStorage.removeItem('self_learn_token');
          setToken(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 1. Real Email Sign Up
  const signupWithEmail = async (email: string, pass: string, name: string, ollamaKey?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: pass,
          displayName: name.trim(),
          ollamaApiKey: ollamaKey?.trim() || ''
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please check your details.');
      }

      localStorage.setItem('self_learn_token', data.token);
      setToken(data.token);
      setIsGuest(false);
      localStorage.removeItem('self_learn_guest_mode');
      syncUserFromDb(data.user);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real Email Sign In
  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: pass
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      localStorage.setItem('self_learn_token', data.token);
      setToken(data.token);
      setIsGuest(false);
      localStorage.removeItem('self_learn_guest_mode');
      syncUserFromDb(data.user);
    } finally {
      setLoading(false);
    }
  };

  // 3. Real Google Sign In (via Firebase Auth)
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        throw new Error('FIREBASE_CONFIG_REQUIRED');
      }

      const googleUser = await authSignInWithGoogleFirebase();

      // Sync with real server database
      const res = await fetch('/api/auth/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleUser.email,
          displayName: googleUser.displayName,
          photoURL: googleUser.photoURL,
          googleId: googleUser.uid
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync Google account with server.');
      }

      localStorage.setItem('self_learn_token', data.token);
      setToken(data.token);
      setIsGuest(false);
      localStorage.removeItem('self_learn_guest_mode');
      syncUserFromDb(data.user);
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout
  const logout = async () => {
    const currentToken = token || localStorage.getItem('self_learn_token');
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
      } catch {}
    }

    localStorage.removeItem('self_learn_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  // 5. Delete Account
  const deleteAccount = async () => {
    const currentToken = token || localStorage.getItem('self_learn_token');
    if (!currentToken) return;

    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete account.');
    }

    localStorage.removeItem('self_learn_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  // 6. Update Profile Details
  const updateProfileDetails = async (displayName: string, photoURL?: string) => {
    const currentToken = token || localStorage.getItem('self_learn_token');
    if (!currentToken) return;

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ displayName, photoURL })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update profile.');
    }

    syncUserFromDb(data.user);
  };

  // 7. Update Password
  const updatePasswordAction = async (newPassword: string) => {
    const currentToken = token || localStorage.getItem('self_learn_token');
    if (!currentToken) throw new Error('Not authenticated.');

    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ newPassword })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update password.');
    }
  };

  // 8. Save Ollama Config
  const saveOllamaConfig = async (key: string, model: string = 'gemma4:31b', host: string = 'https://ollama.com') => {
    localStorage.setItem('self_learn_ai_key', key);
    localStorage.setItem('self_learn_ai_model', model);
    localStorage.setItem('self_learn_ai_host', host);

    const currentToken = token || localStorage.getItem('self_learn_token');
    if (currentToken) {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({
            ollamaApiKey: key,
            ollamaModel: model,
            ollamaHost: host
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          syncUserFromDb(data.user);
        }
      } catch (e) {
        console.warn('Could not sync Ollama config to server profile:', e);
      }
    }
  };

  // 9. Record User Activity
  const recordActivity = async (item: Omit<ActivityItem, 'id' | 'watchedAt'>) => {
    const currentToken = token || localStorage.getItem('self_learn_token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/auth/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(item)
      });
      const data = await res.json();
      if (data.success && data.user) {
        syncUserFromDb(data.user);
      }
    } catch (e) {
      console.warn('Could not sync activity to server:', e);
    }
  };

  const setGuestMode = (flag: boolean) => {
    setIsGuest(flag);
    if (flag) {
      localStorage.setItem('self_learn_guest_mode', 'true');
    } else {
      localStorage.removeItem('self_learn_guest_mode');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        profile,
        token,
        usageCount,
        maxDailyQueries,
        incrementUsage,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        deleteAccount,
        updateProfileDetails,
        updatePasswordAction,
        saveOllamaConfig,
        recordActivity,
        setGuestMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
