import { NextResponse } from 'next/server';
import { addVideoNote, deleteVideoNote } from '@/server/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { videoId, timestampSeconds, content } = body;

    if (!videoId || timestampSeconds === undefined || !content) {
      return NextResponse.json({
        success: false,
        error: 'videoId, timestampSeconds, and content are required',
      }, { status: 400 });
    }

    const note = addVideoNote(params.id, videoId, timestampSeconds, content);
    if (!note) {
      return NextResponse.json({ success: false, error: 'Course or video not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, note });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');
    const noteId = url.searchParams.get('noteId');

    if (!videoId || !noteId) {
      return NextResponse.json({
        success: false,
        error: 'videoId and noteId query parameters are required',
      }, { status: 400 });
    }

    const success = deleteVideoNote(params.id, videoId, noteId);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Note deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

