import { NextResponse } from 'next/server';
import { createUser } from '@/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, displayName, photoURL, ollamaApiKey, ollamaModel, firebaseUid } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const result = createUser({
      email,
      password,
      displayName,
      photoURL,
      ollamaApiKey,
      ollamaModel,
      authProvider: 'local',
      firebaseUid,
    });

    return NextResponse.json({ success: true, user: result.user, token: result.token }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

