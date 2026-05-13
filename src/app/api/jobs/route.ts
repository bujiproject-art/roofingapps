import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('revo_jobs')
    .select('*, revo_customers(name, address, city, state)')
    .eq('expert_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.customer_id) return NextResponse.json({ error: 'customer_id required' }, { status: 400 });

  // Verify ownership
  const { data: customer } = await supabaseAdmin
    .from('revo_customers').select('id').eq('id', body.customer_id).eq('expert_id', user.id).maybeSingle();
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  // Generate job number
  const jobNum = 'RV-' + Date.now().toString(36).toUpperCase().slice(-6);

  const { data, error } = await supabaseAdmin
    .from('revo_jobs')
    .insert({
      expert_id: user.id,
      customer_id: body.customer_id,
      job_number: jobNum,
      job_type: body.job_type || 'inspection',
      description: body.description || null,
      estimated_cost: body.estimated_cost || null,
      scheduled_date: body.scheduled_date || null,
      status: body.status || 'pending',
      before_photos: [],
      after_photos: [],
      drone_photos: [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
