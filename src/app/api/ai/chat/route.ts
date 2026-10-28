import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, hostUrl, model, messages, videoContext } = body;
    const targetHost = (hostUrl && hostUrl.trim()) || 'https://ollama.com';
    const targetModel = (model && model.trim()) || 'gemma4:31b';

    const systemPrompt = `You are a concise, helpful AI personal coding tutor inside "Self Learn" (distraction-free YouTube learning classroom).
The student is watching a course and asking questions about the material or specific video timestamps.

CURRENT VIDEO CONTEXT:
- Course: "${videoContext?.courseTitle || 'Untitled Course'}"
- Channel: "${videoContext?.channelTitle || 'Course Instructor'}"
- Lesson: "${videoContext?.videoTitle || 'Active Lesson'}"
- Current Video Time: ${videoContext?.timestampFormatted || '00:00'} (${videoContext?.currentTimeSeconds || 0}s)
- Total Duration: ${videoContext?.durationFormatted || 'Unknown'} (${videoContext?.durationSeconds || 0}s)
${videoContext?.courseDescription ? `- Course Overview: ${videoContext.courseDescription.slice(0, 300)}` : ''}
${videoContext?.notes && videoContext.notes.length > 0 ? `- Student Notes on this video:\n${videoContext.notes.map((n: any) => `  [${Math.floor(n.timestamp/60)}:${String(n.timestamp%60).padStart(2,'0')}]: ${n.text || n.content}`).join('\n')}` : ''}

TUTOR GUIDELINES:
1. BE SHORT & DIRECT: Answer in 2 to 4 concise sentences or a compact bulleted list. Do NOT write long paragraphs or walls of text.
2. ONLY EXPLAIN WHEN NEEDED: Give the direct answer or solution first. Only elaborate if the user explicitly asks for detailed theory.
3. CLEAN STRUCTURED MARKDOWN: Format with bold key terms, compact lists, and brief code blocks with language identifiers. Keep code examples short and focused.
4. TIMESTAMPS: When referring to video moments, always write them in [mm:ss] format (e.g., [02:30]) so the student can click to seek the player directly.
5. NO FLUFF: Skip greeting intros (e.g., "Sure, I'd be happy to explain...") and outro pleasantries. Jump straight into the helpful answer.`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || []),
    ];

    // Check if API key is present
    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter your Ollama API key to get started.",
          needsApiKey: true,
        },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    };

    // Try standard Ollama /api/chat
    let apiRes = await fetch(`${targetHost.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: fullMessages,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      const reply = data.message?.content || data.response || '';
      return NextResponse.json({ success: true, reply });
    }

    // Try OpenAI-compatible /v1/chat/completions
    let openAiRes = await fetch(`${targetHost.replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: fullMessages,
      }),
      signal: AbortSignal.timeout(60000),
    }).catch(() => null);

    if (openAiRes && openAiRes.ok) {
      const data = await openAiRes.json();
      const reply = data.choices?.[0]?.message?.content || '';
      return NextResponse.json({ success: true, reply });
    }

    const errStatus = apiRes ? apiRes.status : openAiRes ? openAiRes.status : 502;
    const errText = apiRes ? await apiRes.text().catch(() => '') : (openAiRes ? await openAiRes.text().catch(() => '') : '');

    // Intercept missing, unauthorized, or invalid API key errors
    const isAuthOrKeyError =
      errStatus === 401 ||
      errStatus === 403 ||
      errText.includes('04fad422017f4be2bf29e6900cfeef1e') ||
      errText.toLowerCase().includes('unauthorized') ||
      errText.toLowerCase().includes('api key') ||
      errText.toLowerCase().includes('auth') ||
      errText.toLowerCase().includes('forbidden');

    if (isAuthOrKeyError) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter your Ollama API key to get started.",
          needsApiKey: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Ollama endpoint error (${errStatus}): ${errText.slice(0, 150) || 'Connection failed. Please check your network and settings.'}`,
      },
      { status: errStatus }
    );
  } catch (err: any) {
    console.error('AI chat error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal AI error' }, { status: 500 });
  }
}

