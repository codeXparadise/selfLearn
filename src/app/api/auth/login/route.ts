import { NextResponse } from 'next/server';
import { authenticateUser } from '@/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Please provide both email and password.' }, { status: 400 });
    }

    const result = authenticateUser(email, password);
    return NextResponse.json({ success: true, user: result.user, token: result.token });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 401 });
  }
}

