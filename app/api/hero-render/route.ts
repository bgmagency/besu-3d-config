import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const { ai_prompt, size = '1024x1024' } = await req.json();
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt: ai_prompt, size })
    });
    const j = await r.json();
    const b64 = j?.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: 'no image' }, { status: 502 });
    return NextResponse.json({ hero_url: `data:image/png;base64,${b64}` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'hero failed' }, { status: 400 });
  }
}