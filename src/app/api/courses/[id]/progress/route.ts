import { NextResponse } from 'next/server';
import { updateVideoProgress } from '@/server/db';
import { getSessionUser } from '@/server/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
    const sessionUser = token ? getSessionUser(token) : null;

    const body = await req.json();
    const { videoId, completed, currentTime, duration } = body;
    const userId = sessionUser?.id || body.userId || undefined;

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'videoId is required' }, { status: 400 });
    }

    const updatedCourse = updateVideoProgress(
      params.id,
      videoId,
      { completed, currentTime, duration },
      userId
    );

    if (!updatedCourse) {
      return NextResponse.json({ success: false, error: 'Course or video not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      course: updatedCourse,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
