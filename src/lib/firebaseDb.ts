import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Course } from '@/types';
import { STARTER_COURSES } from '@/server/starterCourses';

/**
 * Resolves the authenticated Firebase UID for security rule compliance
 */
export function resolveTargetUid(userOrUid?: any): string {
  if (typeof userOrUid === 'string' && userOrUid.trim()) {
    return auth.currentUser?.uid || userOrUid;
  }
  return auth.currentUser?.uid || userOrUid?.googleId || userOrUid?.id || userOrUid?.uid || '';
}

/**
 * Save user profile and settings to Firestore: users/{uid}
 */
export async function syncUserProfileToFirebase(user: any) {
  if (!user) return;
  const uid = resolveTargetUid(user);
  if (!uid) return;

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        ollamaApiKey: user.ollamaApiKey || '',
        ollamaModel: user.ollamaModel || 'gemma4:31b',
        activityHistory: user.activityHistory || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      console.warn(
        '⚠️ Firestore Permission Denied: To allow storing user data, update your Firestore Security Rules in Firebase Console:\n' +
        'match /users/{userId}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }'
      );
    } else {
      console.warn('Firestore profile sync error:', err);
    }
  }
}

/**
 * Fetch user profile from Firestore: users/{uid}
 */
export async function getUserProfileFromFirebase(uid: string) {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid) return null;
  try {
    const userRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err: any) {
    console.warn('Firestore fetch user profile warning:', err);
    return null;
  }
}

/**
 * Save or update a course for a specific user: users/{uid}/courses/{courseId}
 */
export async function saveUserCourseToFirebase(uid: string, course: Course) {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid || !course || !course.id) return;
  try {
    // Prevent duplicate playlist under a different courseId
    if (course.playlistId) {
      const existing = await getUserCoursesFromFirebase(targetUid);
      const duplicate = existing.find(c => c.playlistId === course.playlistId && c.id !== course.id);
      if (duplicate) {
        return;
      }
    }
    const courseRef = doc(db, 'users', targetUid, 'courses', course.id);
    await setDoc(
      courseRef,
      {
        ...course,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('Firestore save course warning:', err);
  }
}

/**
 * Fetch all courses for a specific user from Firestore: users/{uid}/courses
 */
export async function getUserCoursesFromFirebase(uid: string): Promise<Course[]> {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid) return [];
  try {
    const coursesRef = collection(db, 'users', targetUid, 'courses');
    const snapshot = await getDocs(coursesRef);
    const courses: Course[] = [];
    snapshot.forEach((docSnap) => {
      courses.push(docSnap.data() as Course);
    });
    return courses;
  } catch (err: any) {
    console.warn('Firestore fetch courses warning:', err);
    return [];
  }
}

/**
 * Fetch a single course for a specific user from Firestore: users/{uid}/courses/{courseId}
 */
export async function getUserCourseFromFirebase(uid: string, courseId: string): Promise<Course | null> {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid || !courseId) return null;
  try {
    const courseRef = doc(db, 'users', targetUid, 'courses', courseId);
    const snap = await getDoc(courseRef);
    if (snap.exists()) {
      return snap.data() as Course;
    }
    return null;
  } catch (err: any) {
    console.warn('Firestore fetch single course warning:', err);
    return null;
  }
}

/**
 * Reset progress of a course for a specific user in Firestore: users/{uid}/courses/{courseId}
 */
export async function resetUserCourseProgressInFirebase(uid: string, courseId: string): Promise<Course | null> {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid || !courseId) return null;
  try {
    const courseRef = doc(db, 'users', targetUid, 'courses', courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) return null;

    const courseData = snap.data() as Course;
    const resetVideos = (courseData.videos || []).map((v) => ({
      ...v,
      completed: false,
      currentTime: 0,
      progressPercent: 0,
    }));

    const updated: Course = {
      ...courseData,
      videos: resetVideos,
      completedVideos: 0,
      overallProgressPercent: 0,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(courseRef, updated, { merge: true });
    return updated;
  } catch (err: any) {
    console.warn('Firestore reset course warning:', err);
    return null;
  }
}

/**
 * Seed starter courses directly to a user's Firestore collection: users/{uid}/courses/{courseId}
 */
export async function seedStarterCoursesToFirebase(uid: string): Promise<Course[]> {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid) return [];

  const existingCourses = await getUserCoursesFromFirebase(targetUid);
  const existingPlaylistIds = new Set(existingCourses.map(c => c.playlistId).filter(Boolean));

  const createdCourses: Course[] = [...existingCourses];
  const now = new Date().toISOString();

  for (let idx = 0; idx < STARTER_COURSES.length; idx++) {
    const starter = STARTER_COURSES[idx];
    if (existingPlaylistIds.has(starter.playlistId)) {
      continue; // Skip duplicate playlist
    }
    const courseId = `starter_${idx + 1}_${Date.now()}`;
    let totalDurSec = 0;
    for (const v of starter.videos) {
      totalDurSec += (v.durationSeconds || 0);
    }

    const newCourse: Course = {
      id: courseId,
      playlistId: starter.playlistId,
      title: starter.title,
      description: starter.description,
      thumbnail: starter.thumbnail,
      channelTitle: starter.channelTitle,
      totalVideos: starter.videos.length,
      completedVideos: 0,
      overallProgressPercent: 0,
      totalDurationSeconds: totalDurSec,
      createdAt: now,
      updatedAt: now,
      videos: starter.videos.map((v, vIdx) => ({
        id: v.id,
        youtubeId: (v as any).youtubeId || v.id,
        title: v.title,
        duration: v.duration,
        durationSeconds: v.durationSeconds,
        thumbnail: v.thumbnail,
        completed: false,
        currentTime: 0,
        progressPercent: 0,
        notes: [],
        order: vIdx + 1,
      })),
    };

    try {
      const courseRef = doc(db, 'users', targetUid, 'courses', courseId);
      await setDoc(courseRef, newCourse);
      createdCourses.push(newCourse);
    } catch (e) {
      console.warn('Failed to seed course to firestore:', e);
    }
  }

  return createdCourses;
}

/**
 * Delete a course from Firestore for a specific user: users/{uid}/courses/{courseId}
 */
export async function deleteUserCourseFromFirebase(uid: string, courseId: string) {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid || !courseId) return;
  try {
    const courseRef = doc(db, 'users', targetUid, 'courses', courseId);
    await deleteDoc(courseRef);
  } catch (err: any) {
    console.warn('Firestore delete course warning:', err);
  }
}

/**
 * Sync video progress to Firestore: users/{uid}/courses/{courseId}
 */
export async function saveUserProgressToFirebase(
  uid: string,
  courseId: string,
  videoId: string,
  currentTime: number,
  duration: number,
  completed: boolean
) {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid || !courseId || !videoId) return;
  try {
    const courseRef = doc(db, 'users', targetUid, 'courses', courseId);
    const snap = await getDoc(courseRef);
    if (snap.exists()) {
      const courseData = snap.data() as Course;
      if (courseData.videos) {
        const updatedVideos = courseData.videos.map((v) => {
          if (v.id === videoId) {
            return {
              ...v,
              currentTime: Math.round(currentTime),
              durationSeconds: Math.round(duration),
              completed,
              progressPercent: duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0,
            };
          }
          return v;
        });

        const completedVideos = updatedVideos.filter((v) => v.completed).length;
        const overallProgressPercent =
          updatedVideos.length > 0 ? Math.round((completedVideos / updatedVideos.length) * 100) : 0;

        await updateDoc(courseRef, {
          videos: updatedVideos,
          completedVideos,
          overallProgressPercent,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err: any) {
    console.warn('Firestore progress sync warning:', err);
  }
}

/**
 * Add or delete a note for a video in Firestore
 */
export async function saveUserNoteToFirebase(
  uid: string,
  courseId: string,
  videoId: string,
  note: { id: string; timestamp: number; text: string; createdAt: string }
) {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid || !courseId || !videoId) return;
  try {
    const courseRef = doc(db, 'users', targetUid, 'courses', courseId);
    const snap = await getDoc(courseRef);
    if (snap.exists()) {
      const courseData = snap.data() as Course;
      if (courseData.videos) {
        const updatedVideos = courseData.videos.map((v) => {
          if (v.id === videoId) {
            const existingNotes = v.notes || [];
            return {
              ...v,
              notes: [...existingNotes, note],
            };
          }
          return v;
        });

        await updateDoc(courseRef, {
          videos: updatedVideos,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err: any) {
    console.warn('Firestore note sync warning:', err);
  }
}

/**
 * Clean up all user data from Firestore on account deletion
 */
export async function deleteUserDataFromFirebase(uid: string) {
  const targetUid = resolveTargetUid(uid);
  if (!targetUid) return;
  try {
    // Delete all courses in the subcollection
    const coursesRef = collection(db, 'users', targetUid, 'courses');
    const snapshot = await getDocs(coursesRef);
    for (const d of snapshot.docs) {
      await deleteDoc(d.ref);
    }
    // Delete user profile document
    await deleteDoc(doc(db, 'users', targetUid));
  } catch (err: any) {
    console.warn('Firestore delete user data warning:', err);
  }
}
