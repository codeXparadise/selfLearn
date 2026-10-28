import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsers(): any[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readSessions(): Record<string, any> {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function writeSessions(sessions: Record<string, any>) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

export function findUserByEmail(email: string) {
  const users = readUsers();
  return users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export function findUserById(id: string) {
  const users = readUsers();
  return users.find(u => u.id === id) || null;
}

export function createUser({
  email,
  password,
  displayName,
  photoURL,
  ollamaApiKey,
  ollamaModel,
  authProvider = 'local',
  firebaseUid,
}: any) {
  const users = readUsers();
  const existing = findUserByEmail(email);

  if (existing) {
    if (firebaseUid) {
      existing.id = firebaseUid;
      if (displayName) existing.displayName = displayName;
      if (ollamaApiKey) existing.ollamaApiKey = ollamaApiKey;
      if (ollamaModel) existing.ollamaModel = ollamaModel;
      writeUsers(users);

      const token = generateSessionToken();
      const sessions = readSessions();
      sessions[token] = {
        userId: existing.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      writeSessions(sessions);
      return { user: sanitizeUser(existing), token };
    }
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const id = firebaseUid || `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();
  let salt = '';
  let passwordHash = '';

  if (password) {
    const hashed = hashPassword(password);
    salt = hashed.salt;
    passwordHash = hashed.hash;
  }

  const newUser = {
    id,
    email: email.trim().toLowerCase(),
    displayName: (displayName && displayName.trim()) || email.split('@')[0],
    photoURL: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
    authProvider,
    passwordHash,
    salt,
    ollamaApiKey: (ollamaApiKey && ollamaApiKey.trim()) || '',
    ollamaModel: (ollamaModel && ollamaModel.trim()) || 'gemma4:31b',
    createdAt: now,
    lastLoginAt: now,
    activityHistory: [],
  };

  users.push(newUser);
  writeUsers(users);

  const token = generateSessionToken();
  const sessions = readSessions();
  sessions[token] = {
    userId: id,
    createdAt: now,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  writeSessions(sessions);

  return { user: sanitizeUser(newUser), token };
}

export function authenticateUser(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  if (!user.passwordHash || !user.salt) {
    throw new Error('This account was created with Google Sign-In. Please sign in with Google.');
  }
  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  user.lastLoginAt = new Date().toISOString();
  const users = readUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
    writeUsers(users);
  }

  const token = generateSessionToken();
  const sessions = readSessions();
  sessions[token] = {
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  writeSessions(sessions);

  return { user: sanitizeUser(user), token };
}

export function syncGoogleUser({ email, displayName, photoURL, googleId }: any) {
  const users = readUsers();
  let user = findUserByEmail(email);
  const now = new Date().toISOString();

  if (user) {
    if (googleId) user.id = googleId;
    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL;
    user.googleId = googleId;
    user.lastLoginAt = now;
    const idx = users.findIndex(u => u.email === user.email);
    users[idx] = user;
    writeUsers(users);
  } else {
    const id = googleId || `usr_g_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    user = {
      id,
      email: email.trim().toLowerCase(),
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
      authProvider: 'google',
      googleId,
      ollamaApiKey: '',
      ollamaModel: 'gemma4:31b',
      createdAt: now,
      lastLoginAt: now,
      activityHistory: [],
    };
    users.push(user);
    writeUsers(users);
  }

  const token = generateSessionToken();
  const sessions = readSessions();
  sessions[token] = {
    userId: user.id,
    createdAt: now,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  writeSessions(sessions);

  return { user: sanitizeUser(user), token };
}

export function getSessionUser(token: string) {
  if (!token) return null;
  const sessions = readSessions();
  const session = sessions[token];
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    delete sessions[token];
    writeSessions(sessions);
    return null;
  }

  const user = findUserById(session.userId);
  return sanitizeUser(user);
}

export function destroySession(token: string) {
  const sessions = readSessions();
  if (sessions[token]) {
    delete sessions[token];
    writeSessions(sessions);
  }
}

export function updateUserProfile(userId: string, updates: any) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found.');

  const user = users[idx];
  if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
  if (updates.photoURL !== undefined) user.photoURL = updates.photoURL;
  if (updates.ollamaApiKey !== undefined) user.ollamaApiKey = updates.ollamaApiKey.trim();
  if (updates.ollamaModel !== undefined) user.ollamaModel = updates.ollamaModel.trim();
  user.updatedAt = new Date().toISOString();

  users[idx] = user;
  writeUsers(users);
  return sanitizeUser(user);
}

export function updateUserPassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found.');

  const hashed = hashPassword(newPassword);
  users[idx].salt = hashed.salt;
  users[idx].passwordHash = hashed.hash;
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);
  return true;
}

export function recordUserActivity(userId: string, activity: any) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  const user = users[idx];
  if (!user.activityHistory) user.activityHistory = [];

  const entry = {
    id: `act_${Date.now()}`,
    courseId: activity.courseId,
    courseTitle: activity.courseTitle,
    videoId: activity.videoId,
    videoTitle: activity.videoTitle,
    timestamp: activity.timestamp || 0,
    updatedAt: new Date().toISOString(),
  };

  user.activityHistory = [
    entry,
    ...user.activityHistory.filter((a: any) => !(a.courseId === activity.courseId && a.videoId === activity.videoId)),
  ].slice(0, 20);

  users[idx] = user;
  writeUsers(users);
  return sanitizeUser(user);
}

export function deleteUserAccount(userId: string) {
  const users = readUsers();
  const filtered = users.filter(u => u.id !== userId);
  writeUsers(filtered);

  const sessions = readSessions();
  for (const [token, s] of Object.entries(sessions)) {
    if ((s as any).userId === userId) {
      delete sessions[token];
    }
  }
  writeSessions(sessions);
  return true;
}

