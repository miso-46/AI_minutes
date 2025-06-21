import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FASTAPI_URL } from '@/lib/fastapi-config';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } },
) {
  // 動的パラメータは await が必要
  const { id } = await context.params;

  // Supabase セッションからアクセストークン取得
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // FastAPI へ問い合わせ（Authorization 付き）
  try {
    const res = await fetch(
      `${FASTAPI_URL}/api/get_minutes_list?minutes_id=${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      },
    );
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 