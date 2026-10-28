import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, hostUrl, model } = body;
    const targetHost = (hostUrl && hostUrl.trim()) || 'https://ollama.com';
    const targetModel = (model && model.trim()) || 'gemma4:31b';

    // Check if API key is present
    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter your Ollama API key to get started.",
        },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    };

    let testRes = await fetch(`${targetHost.replace(/\/+$/, '')}/api/tags`, {
      headers,
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);

    if (!testRes || !testRes.ok) {
      testRes = await fetch(`${targetHost.replace(/\/+$/, '')}/api/version`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }).catch(() => null);
    }

    if (!testRes) {
      testRes = await fetch(`${targetHost.replace(/\/+$/, '')}/v1/models`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }).catch(() => null);
    }

    if (!testRes) {
      return NextResponse.json({
        success: false,
        error: `Could not reach ${targetHost}. Please verify your API key and connection.`,
      }, { status: 502 });
    }

    if (!testRes.ok) {
      const errText = await testRes.text().catch(() => '');

      const isAuthOrKeyError =
        testRes.status === 401 ||
        testRes.status === 403 ||
        errText.includes('04fad422017f4be2bf29e6900cfeef1e') ||
        errText.toLowerCase().includes('unauthorized') ||
        errText.toLowerCase().includes('api key') ||
        errText.toLowerCase().includes('auth');

      if (isAuthOrKeyError) {
        return NextResponse.json(
          {
            success: false,
            error: "Please enter your Ollama API key to get started.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: false,
        error: `API error (HTTP ${testRes.status}): ${errText.slice(0, 150)}`,
      }, { status: testRes.status });
    }

    return NextResponse.json({
      success: true,
      message: `Connected to ${targetModel} successfully!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Connection failed' }, { status: 500 });
  }
}

