// DEMO-ONLY bypass route — accepts no code; if reached, generates a magic-link
// token for the demo admin. Gated to non-production so a misconfigured
// deployment can't expose this in front of a real client.
//
// Safe states:
//   - NODE_ENV=development          → enabled (local dev)
//   - REVO_ALLOW_DEMO_BYPASS=true   → enabled (explicit opt-in, e.g. demo box)
//   - anything else                 → 404 (route effectively removed)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_EMAIL = 'bujiproject@gmail.com';

function demoEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  if (process.env.REVO_ALLOW_DEMO_BYPASS === 'true') return true;
  return false;
}

export async function POST() {
  if (!demoEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
