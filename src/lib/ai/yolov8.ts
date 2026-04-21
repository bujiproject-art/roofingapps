// YOLOv8 Custom Model (Phase 2) — Revolution Roofing fine-tuned damage detector.
//
// ARCHITECTURE:
// Phase 1 (current): OpenAI Vision (GPT-4o) in `vision.ts` handles all photo
//                    analysis. Ships production-ready on day one.
// Phase 2 (planned): Train a custom YOLOv8 object-detection model on Revolution
//                    Roofing's historical inspection photos. The model learns
//                    roof-specific patterns (shingle types, flashing failures,
//                    regional wear) that general-purpose Vision may miss.
//
// HOW PHASE 2 WILL WORK:
//   1. Export labeled images from `inspection_photos` (after 500+ real inspections
//      have been logged with rep-confirmed damage annotations).
//   2. Run the YOLOv8 training pipeline (separate repo, GPU-hosted).
//   3. Deploy the fine-tuned weights to a Replicate or Modal endpoint.
//   4. This file swaps from a fallback delegate to calling that endpoint.
//
// UNTIL THEN: this module delegates to `vision.ts` (OpenAI Vision).
// `Math.random()` fake annotations have been removed. No simulated damage.

import { analyzeImageWithOpenAIVision } from './vision';

export async function analyzeImageWithYOLOv8(imageUrl: string) {
  // Phase 1: delegate to OpenAI Vision.
  // Phase 2: replace with fetch to fine-tuned YOLOv8 Replicate/Modal endpoint.
  const result = await analyzeImageWithOpenAIVision(imageUrl);
  return {
    has_damage: result.has_damage,
    damage_types: result.damage_types,
    confidence: result.confidence,
    annotations: result.annotations,
    _engine: 'openai-vision-gpt-4o' as const,
    _phase: 1 as const,
  };
}
