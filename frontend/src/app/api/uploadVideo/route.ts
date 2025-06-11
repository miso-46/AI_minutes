import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // EdgeではなくNode.jsランタイムを使う

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // ファイルをBufferに変換
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // FastAPIへ転送
  const fetch = (await import('node-fetch')).default as unknown as typeof globalThis.fetch;
  const FormData = (await import('form-data')) as any;
  const fastapiForm = new FormData();
  fastapiForm.append('file', buffer, file.name);

  const fastapiRes = await fetch('http://localhost:8000/api/upload_video', {
    method: 'POST',
    body: fastapiForm,
    headers: fastapiForm.getHeaders(),
  });

  const fastapiJson = await fastapiRes.json();
  return NextResponse.json(fastapiJson, { status: fastapiRes.status });
}