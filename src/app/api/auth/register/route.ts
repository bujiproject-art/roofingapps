import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const body = await request.json();
  const { first_name, last_name, email, phone, company_name, service_area } = body;
  if (!email || !first_name) return NextResponse.json({ error: 'Email and first name required' }, { status: 400 });

  // Create auth user (magic link flow — sends OTP to email)
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { first_name, last_name, phone, company_name, service_area },
  });
  if (authErr && !/already registered/i.test(authErr.message)) {
    console.error('[revo/register] inviteUserByEmail error:', authErr);
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  // Fall back to OTP signup if invite complains, or send OTP regardless so they enter code
  const { error: otpErr } = await supabaseAdmin.auth.signInWithOtp({ email, options: { shouldCreateUser: true, data: { first_name, last_name } } });
  if (otpErr) {
    console.error('[revo/register] signInWithOtp error:', otpErr);
    return NextResponse.json({ error: otpErr.message }, { status: 400 });
  }

  // Note: revo_users row is created AFTER OTP verify (in /api/auth/verify) via revo_create_expert_profile()
  return NextResponse.json({ success: true, email });
}
