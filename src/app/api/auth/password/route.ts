import { NextResponse } from 'next/server';
import { getSessionUser, updateUserPassword } from '@/server/auth';

export async function PUT(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  const user = getSessionUser(token);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { newPassword } = body;
    updateUserPassword(user.id, newPassword);
    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

