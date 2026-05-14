import { supabaseAdmin } from '@/lib/supabase/admin';
import { FileText, Upload, Pencil, Trash2 } from 'lucide-react';

interface DocRow {
  id: string;
  title: string;
  source_type: string;
  chunk_count: number;
  size_kb: number;
  updated_at: string;
  status: 'indexed' | 'indexing' | 'pending';
}

const PLACEHOLDER_DOCS: DocRow[] = [
  { id: 'demo-1', title: 'Revo Roofing Handbook', source_type: 'pdf', chunk_count: 412, size_kb: 2840, updated_at: '2026-05-09T14:23:00Z', status: 'indexed' },
  { id: 'demo-2', title: 'Insurance Claim Process Guide', source_type: 'google_doc', chunk_count: 188, size_kb: 1120, updated_at: '2026-05-04T09:11:00Z', status: 'indexed' },
  { id: 'demo-3', title: 'Storm Damage Protocols', source_type: 'pdf', chunk_count: 96, size_kb: 640, updated_at: '2026-04-28T16:50:00Z', status: 'indexed' },
  { id: 'demo-4', title: 'Revo Certification Rubric', source_type: 'markdown', chunk_count: 54, size_kb: 84, updated_at: '2026-05-11T22:05:00Z', status: 'indexing' },
];

function formatSize(kb: number) { return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`; }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }

export default async function AdminRagPage() {
  const { data: docs } = await supabaseAdmin
    .from('revo_rag_documents')
    .select('id, title, source_url, embeddings_generated, created_at')
    .order('created_at', { ascending: false });

  let rows: DocRow[];
  if (docs && docs.length > 0) {
    const ids = docs.map(d => d.id);
    const { data: chunks } = await supabaseAdmin
      .from('revo_rag_chunks')
      .select('document_id, content')
      .in('document_id', ids);
    const counts: Record<string, { count: number; bytes: number }> = {};
    (chunks || []).forEach(c => {
      const k = c.document_id as string;
      counts[k] = counts[k] || { count: 0, bytes: 0 };
      counts[k].count += 1;
      counts[k].bytes += (c.content?.length || 0);
    });
    rows = docs.map(d => {
      const c = counts[d.id] || { count: 0, bytes: 0 };
      const source = d.source_url?.includes('docs.google.com') ? 'google_doc' : d.source_url?.endsWith('.pdf') ? 'pdf' : 'markdown';
      return {
        id: d.id,
        title: d.title || 'Untitled',
        source_type: source,
        chunk_count: c.count,
        size_kb: Math.max(1, Math.round(c.bytes / 1024)),
        updated_at: d.created_at,
        status: d.embeddings_generated ? 'indexed' : 'indexing',
      };
    });
  } else {
    rows = PLACEHOLDER_DOCS;
  }

  const totalChunks = rows.reduce((s, r) => s + r.chunk_count, 0);
  const totalSize = rows.reduce((s, r) => s + r.size_kb, 0);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl mb-1">RAG library</h1>
          <p className="text-[#E5E9F2]/60 text-sm">{rows.length} documents · {totalChunks.toLocaleString()} chunks · {formatSize(totalSize)} indexed</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">
          <Upload className="w-4 h-4" /> Add document
        </button>
      </header>

      <div className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/30 text-[#E5E9F2]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">Document</th>
              <th className="text-left px-6 py-3 w-36">Source</th>
              <th className="text-right px-6 py-3 w-28">Chunks</th>
              <th className="text-right px-6 py-3 w-24">Size</th>
              <th className="text-left px-6 py-3 w-40">Last updated</th>
              <th className="text-left px-6 py-3 w-28">Status</th>
              <th className="text-right px-6 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9F2]/5">
            {rows.map(d => (
              <tr key={d.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><FileText className="w-4 h-4 text-[#D4A24C] flex-shrink-0" /><div className="font-medium">{d.title}</div></div></td>
                <td className="px-6 py-4 text-sm text-[#E5E9F2]/70 capitalize">{d.source_type.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4 text-right text-sm font-mono">{d.chunk_count.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-sm font-mono text-[#E5E9F2]/70">{formatSize(d.size_kb)}</td>
                <td className="px-6 py-4 text-sm text-[#E5E9F2]/70">{formatDate(d.updated_at)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${d.status === 'indexed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : d.status === 'indexing' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-gray-500/15 text-gray-300 border-gray-500/30'}`}>{d.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 rounded-lg hover:bg-white/5 text-[#E5E9F2]/60 hover:text-[#D4A24C] transition" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-[#E5E9F2]/60 hover:text-red-400 transition" title="Remove"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20 flex items-start gap-3">
        <FileText className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#E5E9F2]/70">
          Uploads are chunked, embedded, and made available to Revo AI. Index time runs about 2 minutes per 100 KB.
        </div>
      </div>
    </main>
  );
}
