import { NextResponse } from 'next/server';
import { destroySession } from '@/server/auth';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    destroySession(authHeader.slice(7).trim());
  }
  return NextResponse.json({ success: true });
}

