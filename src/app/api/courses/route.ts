import { NextResponse } from 'next/server';
import { getAllCourses, createCourse } from '@/server/db';
import { extractPlaylistId, fetchPlaylistData } from '@/server/playlistParser';
import { getSessionUser } from '@/server/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
    const sessionUser = token ? getSessionUser(token) : null;
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');
    const userId = sessionUser?.id || queryUserId || undefined;

    const courses = getAllCourses(userId);
    return NextResponse.json({ success: true, courses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
    const sessionUser = token ? getSessionUser(token) : null;

    const body = await req.json();
    const { playlistUrl } = body;
    const userId = sessionUser?.id || body.userId || undefined;

    if (!playlistUrl) {
      return NextResponse.json({ success: false, error: 'playlistUrl is required' }, { status: 400 });
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid YouTube Playlist URL or ID. Please provide a valid playlist link.',
      }, { status: 400 });
    }

    // Check if playlist already exists for this user
    const existingCourses = getAllCourses(userId);
    const duplicate = existingCourses.find(c => c.playlistId === playlistId);
    if (duplicate) {
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        error: `This playlist ("${duplicate.title}") is already added to your courses.`,
        course: duplicate,
      }, { status: 409 });
    }

    const playlistData = await fetchPlaylistData(playlistId);
    const newCourse = createCourse(playlistData, userId);

    return NextResponse.json({
      success: true,
      message: 'Course curated successfully from playlist.',
      course: newCourse,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
