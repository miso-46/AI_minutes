import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FASTAPI_URL } from '@/lib/fastapi-config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // ❶ リクエストボディから transcript_id を取得
  const { session_id, message } = await req.json();

  // ❷ Supabase セッションからアクセストークン取得
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ❸ FastAPI へ start chatのリクエスト（POST, minutes_id を送信, Authorization 付き）
  try {
    const res = await fetch(
      `${FASTAPI_URL}/api/send_chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ session_id, message }),
        cache: 'no-store',
      },
    );
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}