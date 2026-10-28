import { NextResponse } from 'next/server';
import { resetCourseProgress } from '@/server/db';
import { getSessionUser } from '@/server/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
    const sessionUser = token ? getSessionUser(token) : null;
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');
    const userId = sessionUser?.id || queryUserId || undefined;

    const updated = resetCourseProgress(params.id, userId);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, course: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
