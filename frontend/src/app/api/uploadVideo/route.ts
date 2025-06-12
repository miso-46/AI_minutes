import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // サーバー用Supabaseクライアント
import { FASTAPI_URL } from '@/lib/fastapi-config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // ファイルをBufferに変換
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Supabaseのセッションからaccess_tokenを取得
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  console.log("accessToken: ",accessToken);

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // FastAPIへ転送
  const fetch = (await import('node-fetch')).default as unknown as typeof globalThis.fetch;
  const { default: FormData } = await import('form-data');
  const fastapiForm = new FormData();
  fastapiForm.append('file', buffer, file.name);

  const fastapiRes = await fetch(`${FASTAPI_URL}/api/upload_video`, {
    method: 'POST',
    body: fastapiForm as any, 
    headers: {
      ...fastapiForm.getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const fastapiJson = await fastapiRes.json();
  return NextResponse.json(fastapiJson, { status: fastapiRes.status });
}