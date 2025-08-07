import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const { file } = await req.json();
    return NextResponse.json({ url: file });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'upload failed' }, { status: 400 });
  }
}