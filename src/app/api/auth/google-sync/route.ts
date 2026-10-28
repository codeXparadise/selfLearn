import { NextResponse } from 'next/server';
import { syncGoogleUser } from '@/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, displayName, photoURL, googleId } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const result = syncGoogleUser({ email, displayName, photoURL, googleId });
    return NextResponse.json({ success: true, user: result.user, token: result.token });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

