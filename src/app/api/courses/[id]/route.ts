import { NextResponse } from 'next/server';
import { getCourseById, deleteCourse } from '@/server/db';
import { getSessionUser } from '@/server/auth';

function resolveUserId(req: Request): string | undefined {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;
  const sessionUser = token ? getSessionUser(token) : null;
  const url = new URL(req.url);
  const queryUserId = url.searchParams.get('userId');
  return sessionUser?.id || queryUserId || undefined;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = resolveUserId(req);
    const course = getCourseById(params.id, userId);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, course });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = resolveUserId(req);
    const success = deleteCourse(params.id, userId);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
