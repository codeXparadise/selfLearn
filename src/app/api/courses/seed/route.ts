import { NextResponse } from 'next/server';
import { seedStarterCourses } from '@/server/db';
import { getSessionUser } from '@/server/auth';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
    const sessionUser = token ? getSessionUser(token) : null;
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');
    const userId = sessionUser?.id || queryUserId || undefined;

    const courses = seedStarterCourses(userId);
    return NextResponse.json({ success: true, count: courses.length, courses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
