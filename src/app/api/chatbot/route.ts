// Revo AI chatbot — Claude-backed Q&A for roofing experts.
//
// Pipeline:
//   1. Pull top-3 KB chunks from revo_rag_chunks via simple LIKE/word-overlap
//      retrieval. (Vector-search lands when the indexer cron generates
//      embeddings; this keyword match is the bridge.)
//   2. Send question + retrieved context to Claude 3.5 Sonnet with a system
//      prompt that grounds answers in the network's roofing expertise.
//   3. Stream-back the answer text. Falls back to a clear "AI unavailable"
//      message if the ANTHROPIC_API_KEY is unset or the call errors.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = 'claude-3-5-sonnet-20241022';

const SYSTEM_PROMPT = `You are Revo AI, a coaching assistant for Revolution Roofing field experts.

You answer questions about:
- Roofing materials (asphalt, metal, tile, flat membrane)
- Damage assessment (hail, wind, age, debris, flashing, ventilation)
- Insurance claims (Xactimate, ITEL, supplements, ACV vs RCV, depreciation)
- Sales process (first call, inspection, proposal, close, follow-up)
- Pricing (regional Atlanta/Southeast benchmarks 2025-2026)
- Code compliance (manufacturer specs, IBC, regional amendments)
- Crew + business operations

Answer style:
- Direct, specific, dollar amounts where relevant
- Reference real shingle systems by brand when helpful
- 80-180 words per answer unless the question is multi-part
- No corporate hedging. The reader is a field expert, not a homeowner.
- If you don't know, say so — never fabricate code references or specs.`;

interface RagChunk {
  content: string;
  document_id: string;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]{3,}/g) || [];
}

async function retrieveContext(question: string): Promise<RagChunk[]> {
  // Word-overlap retrieval over the KB until vector embeddings are populated.
  // Pulls a generous candidate set then ranks by token overlap.
  const tokens = tokenize(question).slice(0, 6);
  if (tokens.length === 0) return [];

  // ilike search — best-effort, OR the first 3 strongest tokens
  const orFilters = tokens
    .slice(0, 3)
    .map((t) => `content.ilike.%${t}%`)
    .join(',');

  const { data } = await supabaseAdmin
    .from('revo_rag_chunks')
    .select('content, document_id')
    .or(orFilters)
    .limit(20);

  const candidates = (data || []) as RagChunk[];
  if (candidates.length === 0) return [];

  const qSet = new Set(tokens);
  const scored = candidates.map((c) => {
    const score = tokenize(c.content).filter((t) => qSet.has(t)).length;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.c);
}

async function callClaude(question: string, context: RagChunk[]): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API not configured');
  }
  const contextBlock =
    context.length > 0
      ? `\n\nReference material from the Revo knowledge base:\n${context
          .map((c, i) => `[${i + 1}] ${c.content}`)
          .join('\n\n')}\n\nUse the references when relevant; cite them as [1], [2] inline.`
      : '';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question + contextBlock }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string =
    data?.content?.[0]?.text ||
    data?.content?.map?.((p: { text?: string }) => p.text).filter(Boolean).join('\n') ||
    '';
  return text.trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const question = String(body.question || '').trim();
  if (!question || question.length < 3) {
    return NextResponse.json({ error: 'question required' }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: 'question too long (max 2000 chars)' }, { status: 400 });
  }

  try {
    const context = await retrieveContext(question);
    const answer = await callClaude(question, context);
    return NextResponse.json({
      answer,
      sources: context.length,
      model: MODEL,
    });
  } catch (err) {
    console.error('[revo/chatbot]', err);
    return NextResponse.json(
      {
        error:
          'Revo AI is temporarily unavailable. Try again in a moment, or use one of the suggested questions while we get this back online.',
      },
      { status: 503 },
    );
  }
}
