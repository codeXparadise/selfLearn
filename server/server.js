import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateVideoProgress,
  resetCourseProgress,
  addVideoNote,
  deleteVideoNote,
  readCoursesData
} from './db.js';
import {
  createUser,
  authenticateUser,
  syncGoogleUser,
  updateUserProfile,
  updateUserPassword,
  recordUserActivity,
  deleteUserAccount,
  getSessionUser,
  destroySession
} from './auth.js';
import { extractPlaylistId, fetchPlaylistData } from './playlistParser.js';
import { STARTER_COURSES } from './starterCourses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Seed initial starter courses if store is empty
try {
  const current = readCoursesData();
  if (current.length === 0) {
    console.log('Seeding starter course...');
    for (const starter of STARTER_COURSES) {
      createCourse(starter);
    }
  }
} catch (e) {
  console.error('Initial seed check error:', e);
}

// 1. Get all courses
app.get('/api/courses', (req, res) => {
  try {
    const courses = getAllCourses();
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get single course by ID
app.get('/api/courses/:id', (req, res) => {
  try {
    const course = getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Parse YouTube Playlist URL
app.post('/api/playlist/parse', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Playlist URL or ID is required' });
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube playlist URL or ID. Please provide a valid playlist link (e.g., https://www.youtube.com/playlist?list=...)'
      });
    }

    const playlistData = await fetchPlaylistData(playlistId);
    if (!playlistData.videos || playlistData.videos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No videos found in this playlist. Please check that the playlist is public or unlisted.'
      });
    }

    res.json({ success: true, playlist: playlistData });
  } catch (err) {
    console.error('Error parsing playlist:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create a course (either by fetching playlist or with custom videos)
app.post('/api/courses', async (req, res) => {
  try {
    const { url, courseName, customVideos, description, thumbnail } = req.body;

    let playlistId = null;
    let playlistData = null;

    if (url) {
      playlistId = extractPlaylistId(url);
      if (!playlistId && !customVideos) {
        return res.status(400).json({ success: false, error: 'Invalid playlist URL' });
      }
      try {
        playlistData = await fetchPlaylistData(playlistId);
      } catch (err) {
        if (!customVideos || customVideos.length === 0) {
          return res.status(400).json({ success: false, error: `Could not fetch playlist: ${err.message}` });
        }
      }
    }

    const videos = customVideos || playlistData?.videos || [];
    if (videos.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot create course: No videos provided or found in playlist.' });
    }

    const finalTitle = (courseName && courseName.trim()) || playlistData?.title || 'My YouTube Course';
    const finalChannel = playlistData?.channelTitle || 'YouTube Creator';
    const finalDescription = description || playlistData?.description || '';
    const finalThumbnail = thumbnail || playlistData?.thumbnail || videos[0]?.thumbnail;

    const newCourse = createCourse({
      title: finalTitle,
      playlistUrl: url || '',
      playlistId: playlistId || '',
      channelTitle: finalChannel,
      description: finalDescription,
      thumbnail: finalThumbnail,
      videos
    });

    res.status(201).json({ success: true, course: newCourse });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Update course info
app.put('/api/courses/:id', (req, res) => {
  try {
    const { title, description } = req.body;
    const updated = updateCourse(req.params.id, { title, description });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, course: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Delete course
app.delete('/api/courses/:id', (req, res) => {
  try {
    const success = deleteCourse(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Update video playback progress
app.post('/api/courses/:id/progress', (req, res) => {
  try {
    const { videoId, currentTime, duration, completed } = req.body;
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'videoId is required' });
    }

    const updatedCourse = updateVideoProgress(req.params.id, videoId, {
      currentTime,
      duration,
      completed
    });

    if (!updatedCourse) {
      return res.status(404).json({ success: false, error: 'Course or video not found' });
    }

    res.json({ success: true, course: updatedCourse });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Reset course progress
app.post('/api/courses/:id/reset', (req, res) => {
  try {
    const reset = resetCourseProgress(req.params.id);
    if (!reset) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, course: reset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Add note to a video
app.post('/api/courses/:id/videos/:videoId/notes', (req, res) => {
  try {
    const { timestamp, text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }
    const note = addVideoNote(req.params.id, req.params.videoId, { timestamp, text });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Course or video not found' });
    }
    res.status(201).json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Delete note from a video
app.delete('/api/courses/:id/videos/:videoId/notes/:noteId', (req, res) => {
  try {
    const success = deleteVideoNote(req.params.id, req.params.videoId, req.params.noteId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Seed starter courses endpoint
app.post('/api/courses/seed-starter', (req, res) => {
  try {
    for (const starter of STARTER_COURSES) {
      createCourse(starter);
    }
    const courses = getAllCourses();
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Test Ollama Cloud / Host Connection
app.post('/api/ai/test', async (req, res) => {
  const { apiKey, hostUrl, model } = req.body;
  const targetHost = (hostUrl && hostUrl.trim()) || 'https://ollama.com';
  const targetModel = (model && model.trim()) || 'gemma4:31b';

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    // Try pinging /api/chat with a minimal ping
    let testRes = await fetch(`${targetHost.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: 'hello' }],
        stream: false
      }),
      signal: AbortSignal.timeout(10000)
    }).catch(() => null);

    // Fallback to OpenAI-compatible endpoint
    if (!testRes || !testRes.ok) {
      testRes = await fetch(`${targetHost.replace(/\/+$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'hello' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(10000)
      }).catch(() => null);
    }

    if (!testRes) {
      return res.status(502).json({
        success: false,
        error: `Could not reach ${targetHost}. Please verify your API key and connection.`
      });
    }

    if (!testRes.ok) {
      const errText = await testRes.text();
      return res.status(testRes.status).json({
        success: false,
        error: `API error (HTTP ${testRes.status}): ${errText.slice(0, 200)}`
      });
    }

    res.json({ success: true, message: `Connected to ${targetModel} successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Connection failed' });
  }
});

// 13. AI Query with Timestamp & Video Context
app.post('/api/ai/chat', async (req, res) => {
  const { apiKey, hostUrl, model, messages, videoContext } = req.body;
  const targetHost = (hostUrl && hostUrl.trim()) || 'https://ollama.com';
  const targetModel = (model && model.trim()) || 'gemma4:31b';

  const systemPrompt = `You are an AI Personal Tutor inside "self learn", a custom YouTube Course Hub.
The student is watching a course and asking questions in natural language, often referencing specific video timestamps.

CURRENT VIDEO CONTEXT:
- Course Name: "${videoContext?.courseTitle || 'Untitled Course'}"
- Instructor/Channel: "${videoContext?.channelTitle || 'Course Instructor'}"
- Current Lesson: "${videoContext?.videoTitle || 'Active Lesson'}"
- Current Player Timestamp: ${videoContext?.timestampFormatted || '00:00'} (${videoContext?.currentTimeSeconds || 0} seconds)
- Total Lesson Duration: ${videoContext?.durationFormatted || 'Unknown'} (${videoContext?.durationSeconds || 0} seconds)
${videoContext?.courseDescription ? `- Course Description: ${videoContext.courseDescription}` : ''}
${videoContext?.notes && videoContext.notes.length > 0 ? `- Student Notes on this video:\n${videoContext.notes.map(n => `  [${Math.floor(n.timestamp/60)}:${String(n.timestamp%60).padStart(2,'0')}]: ${n.text}`).join('\n')}` : ''}

PEDAGOGICAL INSTRUCTIONS:
1. Provide accurate, clear, and encouraging explanations.
2. If the student asks about what is happening "at this timestamp", "here", "now", or at a specific time (e.g. "${videoContext?.timestampFormatted}"), use the lesson title and topic to give a direct, deep breakdown of the concept and code.
3. If they ask for examples, write clean, well-formatted code snippets with markdown backticks and language identifiers.
4. When you mention specific times in your answer, write them in [mm:ss] format (e.g., [04:15]) so the user can easily reference and click them to jump back in the player.
5. Be concise yet comprehensive. Avoid generic filler.`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages || [])
  ];

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    let apiRes = await fetch(`${targetHost.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: fullMessages,
        stream: false
      }),
      signal: AbortSignal.timeout(60000)
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      const reply = data.message?.content || data.response || '';
      return res.json({ success: true, reply });
    }

    // Try OpenAI compatible route /v1/chat/completions
    let openAiRes = await fetch(`${targetHost.replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: fullMessages
      }),
      signal: AbortSignal.timeout(60000)
    }).catch(() => null);

    if (openAiRes && openAiRes.ok) {
      const data = await openAiRes.json();
      const reply = data.choices?.[0]?.message?.content || '';
      return res.json({ success: true, reply });
    }

    const errStatus = apiRes ? apiRes.status : (openAiRes ? openAiRes.status : 502);
    const errText = apiRes ? await apiRes.text().catch(() => '') : '';
    
    return res.status(errStatus).json({
      success: false,
      error: `Ollama Cloud endpoint (${targetHost}) error (status ${errStatus}): ${errText.slice(0, 200) || 'Failed to connect. Check your API key and endpoint URL.'}`
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal AI error' });
  }
});

// ---------------------------------------------------------------------------
// Real Authentication Middleware & Endpoints
// ---------------------------------------------------------------------------

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
  }
  const token = authHeader.slice(7).trim();
  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in again.' });
  }
  req.user = user;
  req.token = token;
  next();
}

// 1. Real User Registration
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, displayName, photoURL, ollamaApiKey, ollamaModel } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }
    const result = createUser({
      email,
      password,
      displayName,
      photoURL,
      ollamaApiKey,
      ollamaModel,
      authProvider: 'local'
    });
    res.status(201).json({ success: true, user: result.user, token: result.token });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Real User Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide both email and password.' });
    }
    const result = authenticateUser(email, password);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 3. Real Google Account Sync
app.post('/api/auth/google-sync', (req, res) => {
  try {
    const { email, displayName, photoURL, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required from Google sign-in.' });
    }
    const result = syncGoogleUser({ email, displayName, photoURL, googleId });
    res.json({ success: true, user: result.user, token: result.token });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Current User Session Verification
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// 5. Update Profile Details & Ollama Config
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  try {
    const updatedUser = updateUserProfile(req.user.id, req.body);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Update Password
app.put('/api/auth/password', authMiddleware, (req, res) => {
  try {
    const { newPassword } = req.body;
    updateUserPassword(req.user.id, newPassword);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Record Video Watch Activity for User
app.post('/api/auth/activity', authMiddleware, (req, res) => {
  try {
    const updatedUser = recordUserActivity(req.user.id, req.body);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Delete Account
app.delete('/api/auth/account', authMiddleware, (req, res) => {
  try {
    deleteUserAccount(req.user.id);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Sign Out / Invalidate Session
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    destroySession(authHeader.slice(7).trim());
  }
  res.json({ success: true });
});

// 10. Firebase Configuration Store & Check
const FIREBASE_CONFIG_FILE = path.join(__dirname, 'data', 'firebase-config.json');

app.get('/api/config/firebase', (req, res) => {
  let fileConfig = null;
  if (fs.existsSync(FIREBASE_CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_FILE, 'utf-8'));
    } catch {}
  }
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || fileConfig?.apiKey || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || fileConfig?.authDomain || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || fileConfig?.projectId || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || fileConfig?.storageBucket || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fileConfig?.messagingSenderId || '',
    appId: process.env.VITE_FIREBASE_APP_ID || fileConfig?.appId || ''
  };
  const isConfigured = Boolean(config.apiKey && config.projectId);
  res.json({ success: true, isConfigured, config });
});

app.post('/api/config/firebase', (req, res) => {
  try {
    const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = req.body;
    if (!apiKey || !projectId) {
      return res.status(400).json({ success: false, error: 'apiKey and projectId are required.' });
    }
    const configData = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
    fs.writeFileSync(FIREBASE_CONFIG_FILE, JSON.stringify(configData, null, 2), 'utf-8');
    res.json({ success: true, message: 'Firebase configuration saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build if available
const distPath = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Self Learn Server running at http://localhost:${PORT}`);
});
