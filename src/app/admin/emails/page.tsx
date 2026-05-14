import { supabaseAdmin } from '@/lib/supabase/admin';
import { Mail, Plus, Pencil, Send } from 'lucide-react';

interface EmailRow {
  id: string;
  catalog_id: string;
  category: string;
  subject: string;
  is_active: boolean;
  send_count: number;
  open_rate: number;
}

const PLACEHOLDER_EMAILS: EmailRow[] = [
  { id: 'demo-1', catalog_id: 'EXPERT-WELCOME-01', category: 'expert_onboarding', subject: 'Welcome to Revo Roofing AI — your 30-day path to certification', is_active: true, send_count: 124, open_rate: 0.62 },
  { id: 'demo-2', catalog_id: 'EXPERT-LESSON-REMINDER-01', category: 'expert_onboarding', subject: 'Pick up where you left off — Module 4: Drone Inspection Fundamentals', is_active: true, send_count: 318, open_rate: 0.54 },
  { id: 'demo-3', catalog_id: 'EXPERT-CERT-AWARDED-01', category: 'expert_onboarding', subject: "You're Revo Certified — claim your badge and public profile", is_active: true, send_count: 41, open_rate: 0.78 },
];

export default async function AdminEmailsPage() {
  const { data } = await supabaseAdmin
    .from('revo_email_catalog')
    .select('id, catalog_id, category, subject, is_active')
    .order('category')
    .order('catalog_id');

  const emails: EmailRow[] = (data && data.length > 0)
    ? data.map(e => ({ id: e.id, catalog_id: e.catalog_id, category: e.category, subject: e.subject, is_active: e.is_active, send_count: 0, open_rate: 0 }))
    : PLACEHOLDER_EMAILS;

  const totalSent = emails.reduce((s, e) => s + e.send_count, 0);
  const avgOpen = emails.length ? emails.reduce((s, e) => s + e.open_rate, 0) / emails.length : 0;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">Email templates</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{emails.length} templates · {totalSent.toLocaleString()} sent · {(avgOpen * 100).toFixed(0)}% avg open</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Plus className="w-4 h-4" /> New template
        </button>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">Template</th>
              <th className="text-left px-6 py-3 w-44">Category</th>
              <th className="text-right px-6 py-3 w-24">Sent</th>
              <th className="text-right px-6 py-3 w-24">Open</th>
              <th className="text-left px-6 py-3 w-28">Status</th>
              <th className="text-right px-6 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {emails.map(e => (
              <tr key={e.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4">
                  <div className="font-medium">{e.subject}</div>
                  <div className="text-xs text-[#E5E9F2]/45 mt-1 font-mono">{e.catalog_id}</div>
                </td>
                <td className="px-6 py-4"><span className="inline-block px-2.5 py-1 rounded-full text-xs bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/20 uppercase tracking-wider">{e.category.replace(/_/g, ' ')}</span></td>
                <td className="px-6 py-4 text-right text-sm font-mono">{e.send_count.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-sm font-mono text-[#D4A24C]">{(e.open_rate * 100).toFixed(0)}%</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${e.is_active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-gray-500/15 text-gray-300 border-gray-500/30'}`}>{e.is_active ? 'active' : 'paused'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 rounded-lg hover:bg-white/5 text-[#E5E9F2]/60 hover:text-[#D4A24C] transition" title="Send test"><Send className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-[#E5E9F2]/60 hover:text-[#D4A24C] transition" title="Edit"><Pencil className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
        <Mail className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#E5E9F2]/70">
          <span className="font-semibold text-[#3B82F6]">Resend</span> handles delivery once the API key is set in Admin → Settings → Keys. Templates accept Liquid variables — <code className="px-1.5 py-0.5 rounded bg-black/30 text-xs">{'{{first_name}}'}</code>, <code className="px-1.5 py-0.5 rounded bg-black/30 text-xs">{'{{module_title}}'}</code>.
        </div>
      </div>
    </main>
  );
}
