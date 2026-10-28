import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Storage Helpers
// ---------------------------------------------------------------------------

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

function writeUsers(users) {
  const tempFile = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf-8');
  fs.renameSync(tempFile, USERS_FILE);
}

function readSessions() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading sessions file:', err);
    return {};
  }
}

function writeSessions(sessions) {
  const tempFile = `${SESSIONS_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(sessions, null, 2), 'utf-8');
  fs.renameSync(tempFile, SESSIONS_FILE);
}

// ---------------------------------------------------------------------------
// Cryptographic Password Hashing (PBKDF2 SHA-512 with Salt)
// ---------------------------------------------------------------------------

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Strip sensitive fields
export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------

export function findUserByEmail(email) {
  const users = readUsers();
  return users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export function findUserById(id) {
  const users = readUsers();
  return users.find(u => u.id === id) || null;
}

export function createUser({ email, password, displayName, photoURL, ollamaApiKey, ollamaModel, authProvider = 'local' }) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some(u => u.email && u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  let salt = '';
  let passwordHash = '';
  if (password) {
    const hashed = hashPassword(password);
    salt = hashed.salt;
    passwordHash = hashed.hash;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const avatar = photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(displayName || normalizedEmail)}`;

  const newUser = {
    id,
    email: normalizedEmail,
    displayName: displayName?.trim() || normalizedEmail.split('@')[0],
    photoURL: avatar,
    authProvider,
    salt,
    passwordHash,
    ollamaApiKey: ollamaApiKey?.trim() || '',
    ollamaModel: ollamaModel || 'gemma4:31b',
    ollamaHost: 'https://ollama.com',
    activityHistory: [],
    createdAt: now,
    updatedAt: now
  };

  users.push(newUser);
  writeUsers(users);

  // Create session
  const token = createSession(id);
  return { user: sanitizeUser(newUser), token };
}

export function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (!user || !user.passwordHash || !user.salt) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = verifyPassword(password, user.salt, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const token = createSession(user.id);
  return { user: sanitizeUser(user), token };
}

export function syncGoogleUser({ email, displayName, photoURL, googleId }) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  let user = users.find(u => u.email && u.email.toLowerCase() === normalizedEmail);

  const now = new Date().toISOString();

  if (user) {
    // Update existing user with Google details
    user.authProvider = user.authProvider === 'local' ? 'hybrid' : 'google';
    user.googleId = googleId;
    if (displayName && !user.displayName) user.displayName = displayName;
    if (photoURL && !user.photoURL) user.photoURL = photoURL;
    user.updatedAt = now;
  } else {
    // Create new Google user
    user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split('@')[0],
      photoURL: photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(displayName || normalizedEmail)}`,
      googleId,
      authProvider: 'google',
      salt: '',
      passwordHash: '',
      ollamaApiKey: '',
      ollamaModel: 'gemma4:31b',
      ollamaHost: 'https://ollama.com',
      activityHistory: [],
      createdAt: now,
      updatedAt: now
    };
    users.push(user);
  }

  writeUsers(users);
  const token = createSession(user.id);
  return { user: sanitizeUser(user), token };
}

export function updateUserProfile(userId, { displayName, photoURL, ollamaApiKey, ollamaModel, ollamaHost }) {
  const users = readUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error('User not found.');

  const user = users[index];
  if (displayName !== undefined) user.displayName = displayName.trim();
  if (photoURL !== undefined) user.photoURL = photoURL;
  if (ollamaApiKey !== undefined) user.ollamaApiKey = ollamaApiKey.trim();
  if (ollamaModel !== undefined) user.ollamaModel = ollamaModel;
  if (ollamaHost !== undefined) user.ollamaHost = ollamaHost;
  user.updatedAt = new Date().toISOString();

  users[index] = user;
  writeUsers(users);
  return sanitizeUser(user);
}

export function updateUserPassword(userId, newPassword) {
  const users = readUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error('User not found.');

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const { salt, hash } = hashPassword(newPassword);
  users[index].salt = salt;
  users[index].passwordHash = hash;
  users[index].updatedAt = new Date().toISOString();

  writeUsers(users);
  return true;
}

export function recordUserActivity(userId, activityItem) {
  const users = readUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;

  const user = users[index];
  if (!user.activityHistory) user.activityHistory = [];

  const existingIdx = user.activityHistory.findIndex(a => a.courseId === activityItem.courseId && a.videoId === activityItem.videoId);
  const item = {
    ...activityItem,
    id: activityItem.id || crypto.randomUUID(),
    watchedAt: new Date().toISOString()
  };

  if (existingIdx !== -1) {
    user.activityHistory[existingIdx] = { ...user.activityHistory[existingIdx], ...item };
  } else {
    user.activityHistory.unshift(item);
  }

  // Keep last 50 activities
  user.activityHistory = user.activityHistory.slice(0, 50);
  user.updatedAt = new Date().toISOString();

  users[index] = user;
  writeUsers(users);
  return sanitizeUser(user);
}

export function deleteUserAccount(userId) {
  const users = readUsers();
  const filtered = users.filter(u => u.id !== userId);
  writeUsers(filtered);

  // Clear sessions
  const sessions = readSessions();
  for (const [token, session] of Object.entries(sessions)) {
    if (session.userId === userId) {
      delete sessions[token];
    }
  }
  writeSessions(sessions);
  return true;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function createSession(userId) {
  const sessions = readSessions();
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  sessions[token] = {
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  writeSessions(sessions);
  return token;
}

export function getSessionUser(token) {
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

export function destroySession(token) {
  const sessions = readSessions();
  if (sessions[token]) {
    delete sessions[token];
    writeSessions(sessions);
  }
  return true;
}
