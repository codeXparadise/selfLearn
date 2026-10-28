import { NextResponse } from 'next/server';
import { searchYouTubePlaylists } from '@/server/playlistSearch';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, apiKey, model } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a topic or subject you want to study.' },
        { status: 400 }
      );
    }

    const cleanTopic = topic.trim();
    const recommendations = await searchYouTubePlaylists(cleanTopic);

    return NextResponse.json({
      success: true,
      topic: cleanTopic,
      recommendations,
      reply: `Here are the top 3 best YouTube playlists found for "${cleanTopic}". Which one would you prefer to study? Click "Import Course" on your favorite option below:`,
    });
  } catch (err: any) {
    console.error('Curate playlists error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to find playlists for this topic.' },
      { status: 500 }
    );
  }
}

