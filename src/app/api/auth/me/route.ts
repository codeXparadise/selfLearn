import { NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  const user = getSessionUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
  }

  return NextResponse.json({ success: true, user });
}

