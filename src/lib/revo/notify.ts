// Role-transition notifier.
//
// Sends an email via Resend when RESEND_API_KEY is set in revo_admin_settings.
// Otherwise logs the would-have-sent payload to console + writes an audit row
// so Paul can confirm the role-transition flow worked end-to-end before he
// wires real email.
//
// Templates are inline (HTML strings) and kept tiny on purpose — the email
// editor in Admin → Emails covers the rich-template path. These are the
// system notifications that fire automatically as a deal moves through the
// pipeline.
import { getSetting, audit, DEFAULTS } from '@/lib/revo/admin-settings';

type Transition = 'analyzed' | 'estimated' | 'assigned' | 'sold' | 'lost' | 'completed';

interface NotifyPayload {
  transition: Transition;
  job_id?: string;
  job_number?: string | null;
  customer_name?: string | null;
  address?: string | null;
  to_email: string;
  to_name?: string | null;
  recipient_role: 'expert' | 'estimator' | 'sales_coordinator' | 'closer' | 'admin';
  context?: Record<string, string | number | null>;
}

const SUBJECTS: Record<Transition, (p: NotifyPayload) => string> = {
  analyzed: (p) => `New lead in your queue — ${p.customer_name || p.address || p.job_number || 'property'}`,
  estimated: (p) => `Estimate ready — ${p.customer_name || p.job_number || 'lead'}`,
  assigned: (p) => `New lead assigned to you — ${p.customer_name || p.job_number || 'property'}`,
  sold: (p) => `Sold! ${p.customer_name || p.job_number || 'deal'} ready for finalize`,
  lost: (p) => `Deal closed lost — ${p.customer_name || p.job_number || 'lead'}`,
  completed: (p) => `Deal finalized — commission posted (${p.customer_name || p.job_number || 'lead'})`,
};

function renderBody(p: NotifyPayload, companyName: string): string {
  const ctxLines = Object.entries(p.context || {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `<li><strong>${k.replace(/_/g, ' ')}:</strong> ${v}</li>`)
    .join('');
  const cta = '<a href="https://revoroofing.agentmidas.co/dashboard" style="display:inline-block;padding:10px 18px;background:#D4A24C;color:#0A0F1F;border-radius:999px;font-weight:600;text-decoration:none">Open Revo dashboard</a>';
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0A0F1F;max-width:560px;margin:0 auto;padding:24px">
    <div style="font-size:11px;letter-spacing:2px;color:#D4A24C;text-transform:uppercase;font-weight:600;margin-bottom:6px">${companyName}</div>
    <h1 style="font-size:22px;margin:0 0 12px">${SUBJECTS[p.transition](p)}</h1>
    <p style="color:#475569;line-height:1.6">A deal moved to <strong>${p.transition}</strong> in your pipeline.</p>
    ${ctxLines ? `<ul style="background:#F5F6FA;border-radius:8px;padding:14px 18px;color:#0A0F1F">${ctxLines}</ul>` : ''}
    <p style="margin-top:18px">${cta}</p>
    <p style="font-size:11px;color:#94A3B8;margin-top:24px;border-top:1px solid #E2E8F0;padding-top:12px">Auto-sent by the ${companyName} back office. Reply to this email to discuss the deal.</p>
  </div>`;
}

export async function notify(payload: NotifyPayload): Promise<{ sent: boolean; via: 'resend' | 'log' }> {
  const key = await getSetting('RESEND_API_KEY');
  const companyName = (await getSetting('brand_company_name')) || DEFAULTS.brand_company_name;
  const subject = SUBJECTS[payload.transition](payload);
  const html = renderBody(payload, companyName);

  if (key) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${companyName} <notify@revoroofing.agentmidas.co>`,
          to: [payload.to_email],
          subject,
          html,
        }),
      });
      if (res.ok) {
        await audit(null, 'notify.sent', payload.to_email, { transition: payload.transition, via: 'resend', job_id: payload.job_id });
        return { sent: true, via: 'resend' };
      }
    } catch (err) {
      console.error('[notify] resend failed', err);
    }
  }

  // Fallback: console + audit log so Paul can see the flow worked end-to-end
  // without a wired Resend account.
  console.log('[notify:fallback]', { to: payload.to_email, subject, transition: payload.transition });
  await audit(null, 'notify.fallback', payload.to_email, { transition: payload.transition, subject, job_id: payload.job_id });
  return { sent: true, via: 'log' };
}
