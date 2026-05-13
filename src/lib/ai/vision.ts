// OpenAI Vision integration for roof image damage analysis.
// Uses the Chat Completions API with a multi-modal message (text + image_url).

interface VisionDamageAnnotation {
  damage_type: string;
  severity: 'low' | 'medium' | 'high';
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  confidence: number;
  description: string;
}

interface VisionAnalysisResult {
  has_damage: boolean;
  damage_types: string[];
  confidence: number;
  annotations: VisionAnalysisResult['_annotations'];
  _annotations?: VisionDamageAnnotation[];
  raw_model_response: string;
}

/**
 * Send a roof image to OpenAI Vision (GPT-4o) and parse damage annotations.
 * Returns structured annotations with bounding-box percentages the DamageOverlay
 * component can render directly.
 *
 * Note: Phase 1 uses general-purpose Vision. Phase 2 will fine-tune on Revolution
 * Roofing's historical inspection photos via the `yolov8.ts` pipeline.
 */
export async function analyzeImageWithOpenAIVision(
  imageUrl: string,
): Promise<VisionAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const systemPrompt = `You are a roof damage inspector for Revolution Roofing. Analyze the roof photo and identify any visible damage. For each damage area, provide:
- damage_type (one of: missing_shingle, cracked_shingle, curled_shingle, granule_loss, flashing_damage, gutter_damage, moss_algae, sagging, hail_impact, wind_damage, tpo_tear, epdm_bubble, flat_roof_pooling)
- severity (low | medium | high)
- bounding box as percentages of image (x_percent, y_percent, width_percent, height_percent — 0 to 100)
- confidence (0-100)
- description (one short sentence)

Return ONLY valid JSON, no markdown fences:
{"has_damage": boolean, "damage_types": [], "confidence": 0, "annotations": [{...}]}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this roof for damage. Return JSON only.' },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Vision error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '{}';

  let parsed: Partial<VisionAnalysisResult>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Vision returned non-JSON: ${raw.slice(0, 200)}`);
  }

  return {
    has_damage: parsed.has_damage ?? false,
    damage_types: parsed.damage_types ?? [],
    confidence: parsed.confidence ?? 0,
    annotations: (parsed as { annotations?: VisionDamageAnnotation[] }).annotations ?? [],
    raw_model_response: raw,
  };
}
