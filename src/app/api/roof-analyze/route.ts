import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSetting, audit } from '@/lib/revo/admin-settings';
import { promises as fs } from 'fs';
import path from 'path';

const FALLBACK_SAMPLES = [
  { condition_score: 3, estimated_age_years: 19, urgency: 'within_30_days', damage_types: ['missing_shingle','granule_loss','cracked_shingle','flashing_failure'], estimated_repair_cost_low: 8400, estimated_repair_cost_high: 14200, recommended_action: 'Full replacement recommended within 30 days. Multiple missing shingles, advanced granule loss, compromised chimney flashing.', narrative: 'Multiple high-confidence damage signals detected. The asphalt shingles show advanced granule loss consistent with end-of-life; the south-west elevation is the most weathered. Three discrete missing-shingle voids visible along the windward ridge. Flashing at the chimney shows visible separation and is the highest near-term water-intrusion risk. Insurance claim viability: HIGH.' },
  { condition_score: 5, estimated_age_years: 12, urgency: 'within_6_months', damage_types: ['minor_granule_loss','sealant_aging','small_punctures'], estimated_repair_cost_low: 2200, estimated_repair_cost_high: 4800, recommended_action: 'Targeted repair within 6 months. Replace 18 shingles in the NE valley and reseal the bathroom vent boot.', narrative: 'Roof is mid-lifecycle with localized wear. Granule loss is uniform and within expected wear curves for a 12-year-old asphalt system. The bathroom vent boot is the only urgent item. No structural concerns. Full replacement is not warranted for 6-8 more years assuming proactive repair now.' },
  { condition_score: 8, estimated_age_years: 5, urgency: 'monitor', damage_types: ['minor_debris','gutter_overflow_residue'], estimated_repair_cost_low: 0, estimated_repair_cost_high: 650, recommended_action: 'No structural repair needed. Recommend gutter cleaning + minor debris clearing.', narrative: 'Roof is in excellent condition with no detected damage. Asphalt shingles are uniform, granule retention is at expected new-product levels. Estimated remaining service life: 20+ years assuming routine cleaning.' },
  { condition_score: 1, estimated_age_years: 24, urgency: 'immediate', damage_types: ['major_storm_damage','exposed_decking','sagging','water_intrusion'], estimated_repair_cost_low: 18500, estimated_repair_cost_high: 32000, recommended_action: 'Immediate tarp + emergency replacement. File insurance claim TODAY.', narrative: 'Catastrophic storm-related failure detected. Approximately 35% of the south-facing slope is missing shingles; underlayment and decking are exposed. Visible deflection at the south ridge suggests rafter-level water damage. Insurance claim viability: VERY HIGH.' },
];

const SYSTEM_PROMPT = `You are an expert roofing inspector with 20+ years residential and commercial experience. Analyze the photos provided and return a structured JSON damage report.

Always return valid JSON in EXACTLY this shape, no other commentary:
{
  "condition_score": <integer 1-10>,
  "estimated_age_years": <integer>,
  "urgency": <one of: "immediate" | "within_30_days" | "within_6_months" | "monitor">,
  "damage_types": [<short snake_case strings, e.g. "missing_shingle", "granule_loss", "flashing_failure", "hail_damage", "wind_damage", "water_intrusion", "sagging", "exposed_decking">],
  "estimated_repair_cost_low": <integer USD>,
  "estimated_repair_cost_high": <integer USD>,
  "recommended_action": <one to two sentences, plain English>,
  "narrative": <a paragraph 4-7 sentences with specific details — orientation of damage, materials observed, insurance-claim viability assessment if relevant>
}

Be specific. Use the photo content. If you can't see enough roof to be confident, say so in the narrative and lower condition_score confidence accordingly.`;

async function readFileAsBase64(url: string): Promise<{ data: string; mediaType: string } | null> {
  // url is like /uploads/<userId>/<folder>/<filename>
  if (!url.startsWith('/uploads/')) return null;
  const filepath = path.join(process.cwd(), 'public', url);
  try {
    const bytes = await fs.readFile(filepath);
    const ext = (filepath.split('.').pop() || 'jpg').toLowerCase();
    const mediaType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    return { data: bytes.toString('base64'), mediaType };
  } catch {
    return null;
  }
}

async function callClaudeVision(apiKey: string, imageBlocks: Array<{ data: string; mediaType: string }>) {
  const content: unknown[] = imageBlocks.map(b => ({
    type: 'image',
    source: { type: 'base64', media_type: b.mediaType, data: b.data },
  }));
  content.push({ type: 'text', text: 'Analyze the roof in these photos. Return only the JSON damage report.' });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const text: string = data.content?.[0]?.text || '';
  // Try strict parse, then tolerate code-fences
  let cleaned = text.trim();
  if (cleaned.startsWith('\`\`\`')) cleaned = cleaned.replace(/^\`\`\`(json)?/i, '').replace(/\`\`\`$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Last resort: extract first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse Claude response as JSON');
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const imageUrls: string[] = body.image_urls || [];
  const satelliteLat: number | null = body.satellite_lat ?? null;
  const satelliteLon: number | null = body.satellite_lon ?? null;
  const allowEmpty = satelliteLat !== null && satelliteLon !== null;
  if (imageUrls.length === 0 && !allowEmpty) return NextResponse.json({ error: 'No images' }, { status: 400 });

  // Resolve API key — admin-stored (revo_admin_settings) first, then legacy
  // revo_settings row, then env var.
  let apiKey = await getSetting('ANTHROPIC_API_KEY');
  if (!apiKey) {
    const { data: legacy } = await supabaseAdmin.from('revo_settings').select('anthropic_api_key').eq('id', 1).maybeSingle();
    apiKey = legacy?.anthropic_api_key || process.env.ANTHROPIC_API_KEY || null;
  }

  // Read local image files
  const blocks = (await Promise.all(imageUrls.slice(0, 4).map(readFileAsBase64))).filter((b): b is { data: string; mediaType: string } => b !== null);

  if (apiKey && blocks.length > 0) {
    try {
      const analysis = await callClaudeVision(apiKey, blocks);
      await audit(user.id, 'roof.analyze', null, { provider: 'anthropic', photos: blocks.length });
      return NextResponse.json({
        analysis,
        photos_analyzed: blocks.length,
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        _placeholder: false,
        analyzed_at: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Vision call failed';
      console.error('Claude vision failed, falling back to sample:', msg);
      // Fall through to sample
    }
  }

  // Fallback path — no key, no images, or Claude failure
  await new Promise(r => setTimeout(r, 1800 + Math.random() * 1400));
  const seedSrc = imageUrls.length > 0 ? imageUrls.join('|') : `${satelliteLat ?? 0}|${satelliteLon ?? 0}`;
  const seed = Math.abs(seedSrc.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const sample = FALLBACK_SAMPLES[seed % FALLBACK_SAMPLES.length];
  await audit(user.id, 'roof.analyze', null, { provider: 'placeholder', key_present: !!apiKey, photos: blocks.length });
  return NextResponse.json({
    analysis: sample,
    photos_analyzed: imageUrls.length,
    model: 'sample-fallback',
    provider: 'demo',
    _placeholder: true,
    analyzed_at: new Date().toISOString(),
  });
}
