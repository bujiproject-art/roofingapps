// Unified role-transition writer.
//
// Drives the Iteration 3 back-office pipeline. Each transition validates
// the current status, updates revo_jobs, optionally writes commission rows,
// and notifies the next role via src/lib/revo/notify.ts.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { notify } from '@/lib/revo/notify';
import { audit } from '@/lib/revo/admin-settings';

type Action =
  | 'estimator.submit'        // analyzed → estimated
  | 'sc.assign'               // estimated → assigned
  | 'closer.contacted'        // no status change (logs only)
  | 'closer.appointment_set'  // no status change
  | 'closer.sold'             // assigned → sold
  | 'closer.lost'             // any → rejected
  | 'admin.finalize';         // sold → completed (+ ledger rows)

interface CommissionRow {
  recipient_user_id: string | null;
  recipient_role: 'expert' | 'estimator' | 'closer' | 'sales_coordinator' | 'admin';
  amount_usd: number;
  notes?: string | null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body?.action as Action;
  const jobId = String(body?.job_id || '');
  if (!action || !jobId) return NextResponse.json({ error: 'action + job_id required' }, { status: 400 });

  const { data: job } = await supabaseAdmin
    .from('revo_jobs')
    .select('*, revo_customers(name, address, city, state, email), revo_users!expert_id(email, first_name)')
    .eq('id', jobId)
    .maybeSingle();
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const customer = (job.revo_customers as { name?: string; address?: string; city?: string; state?: string; email?: string } | null) || null;
  const expert = (job.revo_users as { email?: string; first_name?: string } | null) || null;

  const update: Record<string, unknown> = {};
  let nextStatus: string | null = null;
  let notifyTo: { email: string; role: 'expert' | 'estimator' | 'sales_coordinator' | 'closer' | 'admin'; name?: string | null } | null = null;
  let transition: 'analyzed' | 'estimated' | 'assigned' | 'sold' | 'lost' | 'completed' | null = null;
  const commissions: CommissionRow[] = [];

  switch (action) {
    case 'estimator.submit': {
      if (!['analyzed'].includes(job.status)) return NextResponse.json({ error: `Cannot submit estimate from status "${job.status}"` }, { status: 409 });
      nextStatus = 'estimated';
      update.estimator_id = user.id;
      update.estimated_cost = Number(body.customer_total) || job.estimated_cost;
      update.estimate_data = body.estimate_data || null;
      update.estimate_notes = body.notes || null;
      transition = 'estimated';
      // Notify a sales coordinator — pick any user with role='sales_coordinator',
      // else any admin as fallback.
      const { data: sc } = await supabaseAdmin.from('revo_users').select('email, first_name').or('role.eq.sales_coordinator,role.eq.admin').limit(1).maybeSingle();
      if (sc?.email) notifyTo = { email: sc.email, role: 'sales_coordinator', name: sc.first_name };
      break;
    }
    case 'sc.assign': {
      if (!['estimated'].includes(job.status)) return NextResponse.json({ error: `Cannot assign from status "${job.status}"` }, { status: 409 });
      const closerId = String(body.closer_id || '');
      if (!closerId) return NextResponse.json({ error: 'closer_id required' }, { status: 400 });
      nextStatus = 'assigned';
      update.sales_coord_id = user.id;
      update.closer_id = closerId;
      transition = 'assigned';
      const { data: closer } = await supabaseAdmin.from('revo_users').select('email, first_name').eq('id', closerId).maybeSingle();
      if (closer?.email) notifyTo = { email: closer.email, role: 'closer', name: closer.first_name };
      break;
    }
    case 'closer.contacted':
    case 'closer.appointment_set': {
      // No status change — audit only
      await audit(user.id, action, jobId, { note: body.note ?? null });
      return NextResponse.json({ ok: true, status: job.status });
    }
    case 'closer.sold': {
      if (!['assigned', 'estimated'].includes(job.status)) return NextResponse.json({ error: `Cannot mark sold from status "${job.status}"` }, { status: 409 });
      const amount = Number(body.sold_amount);
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'sold_amount required' }, { status: 400 });
      nextStatus = 'sold';
      update.sold_amount = amount;
      transition = 'sold';
      // Notify admin to finalize
      const { data: admin } = await supabaseAdmin.from('revo_users').select('email, first_name').eq('role', 'admin').limit(1).maybeSingle();
      if (admin?.email) notifyTo = { email: admin.email, role: 'admin', name: admin.first_name };
      break;
    }
    case 'closer.lost': {
      nextStatus = 'rejected';
      update.lost_reason = body.reason || 'unspecified';
      transition = 'lost';
      const { data: admin } = await supabaseAdmin.from('revo_users').select('email, first_name').eq('role', 'admin').limit(1).maybeSingle();
      if (admin?.email) notifyTo = { email: admin.email, role: 'admin', name: admin.first_name };
      break;
    }
    case 'admin.finalize': {
      if (!['sold'].includes(job.status)) return NextResponse.json({ error: `Cannot finalize from status "${job.status}"` }, { status: 409 });
      const gross = Number(body.gross_sale);
      if (!Number.isFinite(gross) || gross <= 0) return NextResponse.json({ error: 'gross_sale required' }, { status: 400 });
      nextStatus = 'completed';
      update.actual_cost = gross;
      transition = 'completed';
      // Default commissions per SPEC, override-able in the finalize form payload
      const expertCommission = Number(body.expert_commission) || Math.round(gross * 0.05);
      const closerCommission = Number(body.closer_commission) || Math.round(gross * 0.10);
      const estimatorFee = Number(body.estimator_fee) || 75;
      const scOverride = Number(body.sc_override) || 0;
      if (expertCommission > 0) commissions.push({ recipient_user_id: job.expert_id, recipient_role: 'expert', amount_usd: expertCommission });
      if (closerCommission > 0 && job.closer_id) commissions.push({ recipient_user_id: job.closer_id, recipient_role: 'closer', amount_usd: closerCommission });
      if (estimatorFee > 0 && job.estimator_id) commissions.push({ recipient_user_id: job.estimator_id, recipient_role: 'estimator', amount_usd: estimatorFee });
      if (scOverride > 0 && job.sales_coord_id) commissions.push({ recipient_user_id: job.sales_coord_id, recipient_role: 'sales_coordinator', amount_usd: scOverride });
      // Notify the scout (expert) that the deal closed
      if (expert?.email) notifyTo = { email: expert.email, role: 'expert', name: expert.first_name };
      break;
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  if (nextStatus) update.status = nextStatus;
  const { error: updErr } = await supabaseAdmin.from('revo_jobs').update(update).eq('id', jobId);
  if (updErr) {
    // Audit but surface the CHECK violation so Tom knows the SPEC migration
    // (assigned/sold) hasn't landed yet
    await audit(user.id, `${action}.failed`, jobId, { error: updErr.message, attempted_status: nextStatus });
    return NextResponse.json({ error: updErr.message, hint: 'If this is a CHECK violation, apply iteration-3/_spec_pipeline_status.md migration.' }, { status: 500 });
  }

  if (commissions.length > 0) {
    const rows = commissions.map(c => ({ ...c, job_id: jobId, customer_id: job.customer_id, created_by: user.id }));
    const { error: ledgerErr } = await supabaseAdmin.from('revo_commission_ledger').insert(rows);
    if (ledgerErr) {
      // Audit but don't fail the whole transition
      await audit(user.id, 'commission.ledger.write_failed', jobId, { error: ledgerErr.message, rows });
    }
  }

  await audit(user.id, action, jobId, { next_status: nextStatus });

  if (notifyTo && transition) {
    await notify({
      transition,
      job_id: jobId,
      job_number: job.job_number,
      customer_name: customer?.name,
      address: customer?.address,
      to_email: notifyTo.email,
      to_name: notifyTo.name,
      recipient_role: notifyTo.role,
      context: {
        job_number: job.job_number,
        status: nextStatus,
        gross_sale: typeof update.actual_cost === 'number' ? update.actual_cost : null,
        sold_amount: typeof update.sold_amount === 'number' ? update.sold_amount : null,
      },
    });
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
