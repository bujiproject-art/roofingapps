// DEMO-ONLY bypass route — generates a magic-link token for the demo admin.
// Hard-gated in production per Iteration 3 Phase 1 Section 1. The /login page
// 777777 code stays as a separate surface and is unaffected by this gate.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_EMAIL = 'bujiproject@gmail.com';

export async function POST() {
  // Iteration 3 — production hard gate. Demo bypass MUST NOT respond in prod.
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: DEMO_EMAIL,
  });
  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message || 'Demo bypass unavailable' },
      { status: 500 },
    );
  }
  return NextResponse.json({
    email: DEMO_EMAIL,
    token: data.properties.hashed_token,
  });
}
