import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const FROM = 'Revo Roofing AI <noreply@revo.agentmidas.xyz>';
const RESEND_API_KEY = process.env.RFR_RESEND_API_KEY || process.env.RESEND_API_KEY || '';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: profile } = await supabaseAdmin
    .from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return { error: 'Admin only', status: 403 as const };
  return { user };
}

function renderHtml(subject: string, bodyMd: string): string {
  // Lightweight markdown → HTML. Headings, bold, links, lists, paragraphs.
  const lines = bodyMd.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<br/>');
      continue;
    }
    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((https?:[^)]+)\)/g, '<a href="$2" style="color:#D4A24C">$1</a>');
    if (/^# /.test(line)) {
      if (inList) { out.push('</ul>'); inList = false; }
      html = `<h2 style="color:#D4A24C;font-family:Playfair Display,serif;margin:24px 0 12px">${html.slice(2)}</h2>`;
    } else if (/^- /.test(line)) {
      if (!inList) { out.push('<ul style="margin:8px 0;padding-left:20px">'); inList = true; }
      html = `<li style="margin:6px 0">${html.slice(2)}</li>`;
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      html = `<p style="margin:12px 0;line-height:1.6">${html}</p>`;
    }
    out.push(html);
  }
  if (inList) out.push('</ul>');
  const body = out.join('\n');
  return `<!doctype html><html><body style="margin:0;background:#0A0F1F;color:#E5E9F2;font-family:Inter,system-ui,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">
  <div style="padding-bottom:24px;border-bottom:1px solid rgba(229,233,242,0.1)">
    <div style="font-family:Playfair Display,serif;font-size:28px;color:#D4A24C">Revo Roofing AI</div>
    <div style="font-size:12px;color:rgba(229,233,242,0.6);text-transform:uppercase;letter-spacing:2px;margin-top:4px">${subject.replace(/</g, '&lt;')}</div>
  </div>
  <div style="padding:24px 0">${body}</div>
  <div style="padding-top:24px;border-top:1px solid rgba(229,233,242,0.1);font-size:12px;color:rgba(229,233,242,0.4)">
    Revo Roofing AI · Built with Agent Midas
  </div>
</div>
</body></html>`;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const subject = String(form.get('subject') || '').trim();
  const previewText = String(form.get('preview_text') || '').trim();
  const bodyMd = String(form.get('body_markdown') || '').trim();
  const confirmed = form.get('confirm_send') === 'yes';

  if (!subject || !bodyMd || !confirmed) {
    return NextResponse.json({ error: 'subject + body + confirm required' }, { status: 400 });
  }

  // Fetch active experts
  const { data: experts } = await supabaseAdmin
    .from('revo_users').select('id, email').eq('role', 'expert');
  const recipients = (experts || []).map((e) => e.email).filter(Boolean) as string[];

  let success = 0;
  let failed = 0;
  const html = renderHtml(subject, bodyMd);

  if (RESEND_API_KEY && recipients.length > 0) {
    // Batch via Resend bcc-style — Resend allows one POST per recipient.
    // Loop to keep code simple and isolate failures.
    for (const to of recipients) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });
      if (res.ok) success += 1;
      else failed += 1;
    }
  }

  await supabaseAdmin.from('revo_email_broadcasts').insert({
    subject,
    preview_text: previewText || null,
    body_markdown: bodyMd,
    recipient_count: success,
    failure_count: failed,
    sent_by: auth.user.id,
  });

  redirect('/admin/emails');
}
