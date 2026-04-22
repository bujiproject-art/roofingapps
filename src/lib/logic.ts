// Business logic for risk scoring and damage analysis

import { Database } from '@/lib/supabase/types'

export function calculateRiskScore(damageCount: number, highSeverityCount: number, confidence: number): number {
  const riskScore = damageCount * 5 + highSeverityCount * 15 + (100 - confidence) * 0.5
  return Math.min(Math.max(riskScore, 1), 100)
}

export function determineRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 40) return 'low'
  if (score < 70) return 'medium'
  return 'high'
}

export function generateRepairRecommendation(score: number): string {
  if (score > 80) return 'Immediate repair recommended to prevent further damage.'
  if (score > 50) return 'Repairs should be conducted within 30 days.'
  return 'Monitor the situation and consider repairs within 6 months.'
}