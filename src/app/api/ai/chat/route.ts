import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, hostUrl, model, messages, videoContext, scope } = body;
    const targetHost = (hostUrl && hostUrl.trim()) || 'https://ollama.com';
    const targetModel = (model && model.trim()) || 'gemma4:31b';

    // Extract latest user message
    const latestUserMsg = [...(messages || [])].reverse().find((m: any) => m.role === 'user')?.content || '';

    // Check if the user is asking for a full-video summary, syllabus overview, or general concept
    const isGeneralOrFullVideoQuery = 
      scope === 'entire' ||
      /summarize|summary|overview|entire|whole video|full video|all lessons|outline|syllabus|what is this video about|key takeaways|what is covered|general|in short|tldr|tl;dr/i.test(latestUserMsg);

    const scopeDirective = isGeneralOrFullVideoQuery
      ? `STUDENT INTENT: FULL-LESSON SUMMARY & GENERAL CONCEPTS
The student asked: "${latestUserMsg}"
CRITICAL INSTRUCTION:
- This is a FULL-VIDEO or HIGH-LEVEL SUMMARY question. Do NOT constrain or restrict your response to the current video timestamp (${videoContext?.timestampFormatted || '00:00'}).
- Provide an overarching, comprehensive summary of the ENTIRE lesson "${videoContext?.videoTitle || 'Active Lesson'}" and its core concepts.
- Highlight the major learning objectives and key topics covered across the entire duration (${videoContext?.durationFormatted || 'full lesson'}).
- Keep it concise, structured, and easy to read.`
      : `STUDENT INTENT: TIMESTAMP-SPECIFIC INQUIRY
The student is currently at timestamp ${videoContext?.timestampFormatted || '00:00'} (${videoContext?.currentTimeSeconds || 0}s).
- Focus your explanation primarily on what is being taught, demonstrated, or coded around this timestamp.
- If referencing other moments, write timestamps in [mm:ss] format (e.g., [02:30]) so the student can seek directly.`;

    const systemPrompt = `You are a concise, helpful AI personal coding tutor inside "Self Learn" (distraction-free YouTube learning classroom).
The student is watching a course and asking questions about the material or specific video timestamps.

CURRENT VIDEO & LESSON CONTEXT:
- Course Title: "${videoContext?.courseTitle || 'Untitled Course'}"
- Instructor / Channel: "${videoContext?.channelTitle || 'Course Instructor'}"
- Active Lesson: "${videoContext?.videoTitle || 'Active Lesson'}"
- Current Playback Time: ${videoContext?.timestampFormatted || '00:00'} (${videoContext?.currentTimeSeconds || 0}s)
- Total Lesson Duration: ${videoContext?.durationFormatted || 'Unknown'} (${videoContext?.durationSeconds || 0}s)
${videoContext?.videoDescription ? `- Lesson Description / Topic Outline:\n${videoContext.videoDescription.slice(0, 800)}` : ''}
${videoContext?.courseDescription ? `- Course Curriculum Overview: ${videoContext.courseDescription.slice(0, 400)}` : ''}
${videoContext?.syllabus && videoContext.syllabus.length > 0 ? `- Playlist Lessons Outline:\n${videoContext.syllabus.slice(0, 15).map((title: string, idx: number) => `  ${idx + 1}. ${title}`).join('\n')}` : ''}
${videoContext?.notes && videoContext.notes.length > 0 ? `- Student Notes on this video:\n${videoContext.notes.map((n: any) => `  [${Math.floor(n.timestamp/60)}:${String(n.timestamp%60).padStart(2,'0')}]: ${n.text || n.content}`).join('\n')}` : ''}

${scopeDirective}

TUTOR GUIDELINES:
1. BE SHORT & DIRECT: Answer in 2 to 4 concise sentences or a compact bulleted list. Do NOT write long paragraphs or walls of text.
2. ONLY EXPLAIN WHEN NEEDED: Give the direct answer or solution first. Only elaborate if the user explicitly asks for detailed theory.
3. ADAPT TO SCOPE: If asked to summarize the entire video, summarize the whole lesson from start to finish. If asked about the current timestamp, focus on that moment.
4. CLEAN STRUCTURED MARKDOWN: Format with bold key terms, compact lists, and brief code blocks with language identifiers. Keep code examples short and focused.
5. TIMESTAMPS: When referring to video moments, always write them in [mm:ss] format (e.g., [02:30]) so the student can click to seek the player directly.
6. NO FLUFF: Skip greeting intros (e.g., "Sure, I'd be happy to explain...") and outro pleasantries. Jump straight into the helpful answer.`;

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

