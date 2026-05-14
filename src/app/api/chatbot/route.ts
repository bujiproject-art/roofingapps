// Revo AI chatbot — Claude-backed Q&A with keyword KB fallback.
//
// Pipeline:
//   1. Resolve question, score against 22-entry roofing KB (see KB array).
//   2. If ANTHROPIC_API_KEY present (admin settings or env), send the
//      top-3 KB chunks plus matching revo_rag_chunks rows to Claude as
//      context and stream the answer back.
//   3. If no key OR the LLM call errors, fall back to the highest-scoring
//      KB entry. The user always gets a credible roofing answer.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSetting, audit } from '@/lib/revo/admin-settings';

const MODEL = 'claude-3-5-sonnet-20241022';

const SYSTEM_PROMPT = `You are Revo AI, a coaching assistant for Revolution Roofing field experts.

You answer questions about:
- Roofing materials (asphalt, metal, tile, flat membrane)
- Damage assessment (hail, wind, age, debris, flashing, ventilation)
- Insurance claims (Xactimate, ITEL, supplements, ACV vs RCV, depreciation)
- Sales process (first call, inspection, proposal, close, follow-up)
- Pricing (regional 2025-2026 benchmarks)
- Code compliance (manufacturer specs, IBC, regional amendments)
- Crew + business operations

Answer style:
- Direct, specific, dollar amounts where relevant
- Reference real shingle systems by brand when helpful
- 80-180 words per answer unless the question is multi-part
- No corporate hedging. The reader is a field expert.
- If you don't know, say so — never fabricate code references or specs.`;

interface KbEntry {
  topic: string;
  keywords: string[];
  answer: string;
}

const KB: KbEntry[] = [
  { topic: 'Shingle types', keywords: ['shingle', 'shingles', 'asphalt', 'three-tab', 'architectural', 'dimensional'], answer: 'Architectural (dimensional) shingles are the workhorse for most homes — typically 30-year warranty, $90-$130/sq for materials. Three-tab is cheaper but 20-year max and dates the home. Designer shingles (Presidential, Grand Manor) run 2-3x material cost but pay back in perceived value on premium homes. Always upsell ridge cap and starter strip to match.' },
  { topic: 'Hail damage', keywords: ['hail', 'bruising', 'hailstorm', 'hailstones'], answer: 'Hail damage shows as round dark spots (granular loss exposing the mat) and "bruising" you can feel — press your thumb to suspect spots, a real hit feels soft. 1-inch stones cause cosmetic damage; 1.5-inch+ causes functional damage that qualifies for full replacement under most policies. Document with the chalk-circle method: chalk the impact, photograph, GPS-tag.' },
  { topic: 'Wind damage', keywords: ['wind', 'uplift', 'lift', 'creased'], answer: 'Wind damage shows as lifted, creased, or missing shingles. The threshold for an insurance claim is usually 8+ damaged shingles or one creased shingle per slope. Document each lifted shingle from below (so the seal break shows). Sustained winds 50+ mph trigger most claim approvals.' },
  { topic: 'Insurance claims', keywords: ['insurance', 'claim', 'adjuster', 'acv', 'rcv', 'depreciation', 'xactimate'], answer: 'Most claims pay on RCV (Replacement Cost Value) but release in two checks: ACV up front, depreciation recoverable when work completes. Meet the adjuster on-site with your photo report — every minute they spend reading your evidence is a minute they spend approving. Supplement aggressively for code upgrades (ice/water shield, drip edge, ventilation).' },
  { topic: 'Estimating', keywords: ['estimate', 'estimating', 'square', 'measure', 'pitch', 'sqft'], answer: 'Roofs are sold in "squares" (100 sq ft). Use the drone capture to calculate area + pitch (multiply by pitch factor — 1.05 for 4/12, 1.12 for 6/12, 1.25 for 9/12). Add 10-15% waste for cuts and starter. Cost = (squares × material/sq) + labor + tear-off + dump fee + permit. The platform auto-calculates this from your drone photos.' },
  { topic: 'Drone inspections', keywords: ['drone', 'inspection', 'capture', 'photos', 'aerial', 'part 107'], answer: 'FAA Part 107 is required for paid work. Best capture pattern: corners + 4 cardinal overhead + close-ups of suspect areas. Shoot in golden hour for shadow-line damage visibility. Capture full property + neighbor for context. The platform stitches your photos and runs AI damage detection automatically.' },
  { topic: 'Proposals', keywords: ['proposal', 'quote', 'contract', 'pricing'], answer: 'A winning proposal has 3 sections: damage report (photos + AI findings), scope of work (line items with materials and labor), and investment summary (financing options + warranty). Show the customer their photos with annotations. Close rate doubles when proposals include drone imagery.' },
  { topic: 'Flashing', keywords: ['flashing', 'step flashing', 'chimney', 'valley'], answer: 'Step flashing at walls/chimneys is where 80% of leaks originate. Always replace, never reuse. Valley flashing should be open-metal (W-valley) on premium jobs — woven valleys trap debris and fail at year 12-15. Pipe boots need replacing every roof — they fail before the shingles do.' },
  { topic: 'Ventilation', keywords: ['ventilation', 'ridge vent', 'soffit', 'attic'], answer: 'Code is typically 1 sq ft of net free area per 150 sq ft of attic, split intake (soffit) and exhaust (ridge). Most older homes have intake but no continuous ridge vent — adding it is a $400 upsell that prevents ice dams and extends shingle life by 5+ years. Never mix powered + passive vents on the same plane.' },
  { topic: 'Underlayment', keywords: ['underlayment', 'felt', 'synthetic', 'ice and water', 'ice & water'], answer: 'Synthetic underlayment is now standard ($25-$35/sq vs $20 for felt). Code in most climate zones requires ice & water shield (peel-and-stick) at eaves, valleys, and penetrations. In northern zones, run ice & water up to 24" past the heated wall. This is one of the cleanest "code upgrade" supplements on insurance jobs.' },
  { topic: 'Metal roofing', keywords: ['metal roof', 'metal roofing', 'standing seam'], answer: 'Standing seam metal runs $900-$1,400/sq installed — 3-4x asphalt cost but 50+ year life and best ROI on resale in coastal/storm zones. Most customers won\'t pay for it on a re-roof, but on storm-totaled homes the insurance check often gets them most of the way there.' },
  { topic: 'Flat/commercial roofs', keywords: ['flat roof', 'tpo', 'epdm', 'commercial', 'modified bitumen'], answer: 'TPO is 70% of commercial flat roofs today — white membrane, heat-welded seams, 20-year warranty. EPDM (rubber) is cheaper but black and ages faster. Mod-bit is the legacy choice. Pricing is typically $7-$12/sq ft installed including insulation. Commercial jobs require an additional safety/OSHA prep step.' },
  { topic: 'Ice dams', keywords: ['ice dam', 'ice dams', 'gutter ice'], answer: 'Ice dams come from heat loss through the attic melting roof snow that refreezes at the eaves. Fix: air-seal the ceiling plane, insulate to R-49+, ventilate ridge-to-soffit. Roof rakes and heat cables are band-aids — the real fix is up in the attic. Sell the assessment along with the re-roof.' },
  { topic: 'Repair vs replace', keywords: ['repair vs replace', 'patch', 'repair', 'replace'], answer: 'Replace if: the roof is past 75% of its rated life, has multiple damaged slopes, or has 2+ layers already. Repair if: localized damage on a 10-year-old roof in good shape, customer can\'t fund replacement, or the insurance claim was denied. Repairs are loss-leaders — book them, then re-engage for replacement in 1-3 years.' },
  { topic: 'Gutters', keywords: ['gutter', 'gutters', 'downspout', 'k-style'], answer: 'Gutters tie to roof jobs naturally — most are dented or detached after a storm. Aluminum 5" K-style runs $7-$10/lf, 6" oversized $9-$13/lf. Always quote with leaf guards as an upsell. Replacing gutters during a re-roof saves the customer a second mobilization and is one of the highest-margin add-ons.' },
  { topic: 'Warranties', keywords: ['warranty', 'workmanship', 'manufacturer', 'gaf', 'certainteed', 'owens'], answer: 'Two warranties: manufacturer (material defect, 25-50 years prorated) and workmanship (yours, 5-10 years typical). Become a certified installer with one manufacturer (GAF Master Elite, CertainTeed SELECT, Owens Corning Platinum) to offer enhanced warranties (50-year non-prorated) — huge close-rate boost.' },
  { topic: 'Permits', keywords: ['permit', 'permits', 'inspection city', 'inspection ahj'], answer: 'Most jurisdictions require a permit for re-roofs ($75-$300). Skipping permits voids the manufacturer warranty and can void homeowner insurance. Build permit cost into every quote and pull it for the customer — they will never know how to. Final inspection is usually visual from ground level.' },
  { topic: 'Safety', keywords: ['safety', 'osha', 'harness', 'fall protection'], answer: 'OSHA requires fall protection above 6 ft — full-body harness, lanyard, anchor (ridge tie-off). Most crews violate this constantly. A single OSHA fine is $14,000+. Buy the gear, photograph crews using it, post on social — safety is a differentiator with commercial clients especially.' },
  { topic: 'Financing', keywords: ['financing', 'payment plan', 'monthly', 'greensky', 'synchrony'], answer: 'Offer financing on every quote — GreenSky, Synchrony, and Hearth are the big three. Typical: $20k roof = $189/mo at 9.99% APR over 15 years. Customers close 2-3x more often when monthly payment is shown alongside cash price.' },
  { topic: 'Revo Certification', keywords: ['certification', 'revo certified', 'badge'], answer: 'Complete all 10 course modules + 3 supervised inspections to earn the Revo Certified badge. Certified experts get a public profile page, priority lead routing, and an enhanced warranty backstop. The 30-day path: 1 module/day + ride-alongs the second week + your own first inspections in week 3 + certification review week 4.' },
  { topic: 'Leaderboard', keywords: ['leaderboard', 'rank', 'competition'], answer: 'The weekly leaderboard ranks experts on jobs completed, total revenue, and customer rating. Top 3 each month earn a $500 marketing credit, the #1 slot on regional referral routing, and a feature in the Revo newsletter. The board resets monthly so newcomers can climb fast.' },
  { topic: 'Affiliate program', keywords: ['affiliate', 'referral', 'partner'], answer: 'Your affiliate ID is on your profile page. Share it with any roofer you respect — when they sign up and complete certification, you earn 10% of their platform fee for 12 months. Pays out on the 15th of each month. Best for builders, GCs, and insurance restoration shops who want a roofing arm without hiring.' },
];

function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]{3,}/g) || [];
}

function rankKb(question: string): KbEntry[] {
  const q = question.toLowerCase();
  const qTokens = new Set(tokenize(q));
  const scored = KB.map(e => {
    let score = 0;
    for (const k of e.keywords) {
      if (q.includes(k)) score += k.split(' ').length * 3;
      for (const t of tokenize(k)) if (qTokens.has(t)) score += 1;
    }
    return { e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).map(s => s.e);
}

function fallbackAnswer(question: string): string {
  const matched = rankKb(question);
  if (matched.length > 0) return matched[0].answer;
  return `I cover shingles, hail/wind damage, insurance claims, drone inspections, estimating, ventilation, flashing, gutters, financing, certification, and the Revo affiliate program. Ask a more specific question and I'll give you the best answer I have.`;
}

async function callClaude(apiKey: string, question: string, contextChunks: string[]): Promise<string> {
  const ctx = contextChunks.length > 0
    ? `\n\nReference material from the Revo knowledge base:\n${contextChunks.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}\n\nUse the references when relevant; cite them inline as [1], [2].`
    : '';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question + ctx }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text: string = data?.content?.[0]?.text || data?.content?.map?.((p: { text?: string }) => p.text).filter(Boolean).join('\n') || '';
  return text.trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const question = String(body.question || '').trim();
  if (!question || question.length < 3) return NextResponse.json({ error: 'question required' }, { status: 400 });
  if (question.length > 2000) return NextResponse.json({ error: 'question too long (max 2000 chars)' }, { status: 400 });

  const apiKey = await getSetting('ANTHROPIC_API_KEY');
  const kbMatches = rankKb(question).slice(0, 3);

  if (apiKey) {
    try {
      // Combine top-3 KB chunks with up to 2 vector-search hits from the
      // RAG table so the LLM has both curated and uploaded material.
      const tokens = tokenize(question).slice(0, 3);
      const orFilters = tokens.map(t => `content.ilike.%${t}%`).join(',');
      const { data: ragRows } = orFilters
        ? await supabaseAdmin.from('revo_rag_chunks').select('content').or(orFilters).limit(2)
        : { data: [] };
      const context = [
        ...kbMatches.map(k => `${k.topic}: ${k.answer}`),
        ...((ragRows || []).map(r => r.content as string)),
      ];
      const answer = await callClaude(apiKey, question, context);
      await audit(user.id, 'chatbot.answer', null, { source: 'llm', kb_matches: kbMatches.length, rag_chunks: ragRows?.length || 0 });
      return NextResponse.json({ answer, source: 'llm', sources: context.length, model: MODEL });
    } catch (err) {
      console.error('[chatbot] LLM failed, falling back to KB:', err);
    }
  }

  // KB-only fallback path
  const answer = fallbackAnswer(question);
  await audit(user.id, 'chatbot.answer', null, { source: 'kb', kb_matches: kbMatches.length, key_present: !!apiKey });
  return NextResponse.json({ answer, source: 'kb', sources: kbMatches.length, model: 'revo-kb' });
}
