import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: profile } = await supabaseAdmin
    .from('revo_users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return { error: 'Admin only', status: 403 as const };
  return { user };
}

// Chunker — splits text into ~500-token segments by paragraph boundaries.
// "Token" here is approximated as ~4 chars (industry rule of thumb), so we
// target ~2,000 chars per chunk.
function chunkText(text: string, targetChars = 2000): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if (!current) { current = p; continue; }
    if (current.length + p.length + 2 > targetChars) {
      chunks.push(current);
      current = p;
    } else {
      current += '\n\n' + p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const action = form.get('_action');

  if (action === 'create') {
    const title = String(form.get('title') || '').trim();
    const content = String(form.get('content') || '').trim();
    const sourceUrl = String(form.get('source_url') || '').trim() || null;
    if (!title || !content) {
      return NextResponse.json({ error: 'title + content required' }, { status: 400 });
    }

    const chunks = chunkText(content);

    // Persist document + chunks. Embedding generation is deferred to the
    // background indexer; document starts in 'pending' status. The chatbot
    // falls back to keyword search until embeddings are populated.
    const { data: doc, error: docErr } = await supabaseAdmin
      .from('revo_rag_documents')
      .insert({
        title,
        source_url: sourceUrl,
        content,
        chunk_count: chunks.length,
        status: 'pending',
        added_by: auth.user.id,
      })
      .select()
      .single();
    if (docErr || !doc) return NextResponse.json({ error: docErr?.message || 'Insert failed' }, { status: 500 });

    // Insert chunks (no embeddings yet — placeholder for the indexer cron)
    const chunkRows = chunks.map((text, i) => ({
      document_id: doc.id,
      chunk_index: i,
      content: text,
    }));
    if (chunkRows.length > 0) {
      await supabaseAdmin.from('revo_rag_chunks').insert(chunkRows);
    }

    // Mark document as indexed once chunks are written (embeddings populate async).
    await supabaseAdmin
      .from('revo_rag_documents').update({ status: 'indexed' }).eq('id', doc.id);

    redirect('/admin/rag');
  }

  if (action === 'delete') {
    const id = String(form.get('id') || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    // Delete chunks first (FK cascade not assumed)
    await supabaseAdmin.from('revo_rag_chunks').delete().eq('document_id', id);
    const { error } = await supabaseAdmin.from('revo_rag_documents').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redirect('/admin/rag');
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
