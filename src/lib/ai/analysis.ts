import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type DamageType = Database['public']['Tables']['damage_annotations']['Insert']['damage_type']
type Severity = Database['public']['Tables']['damage_annotations']['Insert']['severity']

interface AIImageAnalysis {
  has_damage: boolean
  damage_types: DamageType[]
  confidence: number
  annotations: Array<{
    damage_type: DamageType
    severity: Severity
    x_percent: number
    y_percent: number
    width_percent: number
    height_percent: number
    confidence: number
    description: string
  }>
}

interface RiskAssessment {
  overall_risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  repair_urgency: Database['public']['Tables']['inspections']['Insert']['repair_urgency']
  estimated_repair_cost: number
  estimated_replacement_cost: number
  factors: Array<{
    label: string
    score: number
    status: string
  }>
}

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, number>()

export class AIAnalysisService {
  private static instance: AIAnalysisService

  private constructor() {}

  static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService()
    }
    return AIAnalysisService.instance
  }

  async analyzeInspection(inspectionId: string, userId: string): Promise<void> {
    // Rate limiting check
    const now = Date.now()
    const lastCall = rateLimitMap.get(userId) || 0
    if (now - lastCall < 1000) { // 1 second between calls
      throw new Error('Rate limit exceeded. Please wait.')
    }
    rateLimitMap.set(userId, now)

    const supabase = await createClient()
    
    try {
      // Verify ownership
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .select('user_id')
        .eq('id', inspectionId)
        .single()

      if (inspectionError) throw inspectionError
      if (!inspection || inspection.user_id !== userId) {
        throw new Error('Unauthorized')
      }

      const { data: photos, error: photosError } = await supabase
        .from('inspection_photos')
        .select('*')
        .eq('inspection_id', inspectionId)

      if (photosError) throw photosError
      if (!photos || photos.length === 0) {
        throw new Error('No photos found for inspection')
      }

      const photoAnalyses = await Promise.all(
        photos.map(photo => this.analyzePhoto(photo.id, photo.storage_path))
      )

      const riskAssessment = this.calculateRiskAssessment(photoAnalyses)

      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          overall_risk_score: riskAssessment.overall_risk_score,
          risk_level: riskAssessment.risk_level,
          repair_urgency: riskAssessment.repair_urgency,
          estimated_repair_cost: riskAssessment.estimated_repair_cost,
          estimated_replacement_cost: riskAssessment.estimated_replacement_cost,
          status: 'analyzed',
          ai_confidence_score: this.calculateAverageConfidence(photoAnalyses)
        })
        .eq('id', inspectionId)

      if (updateError) throw updateError

      for (const analysis of photoAnalyses) {
        if (analysis.annotations.length > 0) {
          const annotations = analysis.annotations.map(ann => ({
            photo_id: analysis.photoId,
            damage_type: ann.damage_type,
            severity: ann.severity,
            x_percent: ann.x_percent,
            y_percent: ann.y_percent,
            width_percent: ann.width_percent,
            height_percent: ann.height_percent,
            ai_confidence: ann.confidence,
            description: ann.description,
            repair_recommendation: null
          }))

          const { error: annotationsError } = await supabase
            .from('damage_annotations')
            .insert(annotations)

          if (annotationsError) throw annotationsError
        }
      }

    } catch (error) {
      console.error('Error analyzing inspection:', error)
      throw error
    }
  }

  private async analyzePhoto(photoId: string, imageUrl: string): Promise<AIImageAnalysis & { photoId: string }> {
    const supabase = await createClient()
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock analysis - replace with actual OpenAI Vision or YOLOv8 call
    const hasDamage = Math.random() > 0.3
    const mockAnalysis: AIImageAnalysis = {
      has_damage: hasDamage,
      damage_types: hasDamage ? ['missing_shingle', 'cracked_shingle'] : [],
      confidence: 85 + Math.random() * 10,
      annotations: hasDamage ? [
        {
          damage_type: 'missing_shingle',
          severity: 'high',
          x_percent: 45,
          y_percent: 30,
          width_percent: 12,
          height_percent: 8,
          confidence: 92,
          description: 'Multiple missing shingles detected in high-wind zone'
        },
        {
          damage_type: 'cracked_shingle',
          severity: 'medium',
          x_percent: 25,
          y_percent: 50,
          width_percent: 15,
          height_percent: 10,
          confidence: 88,
          description: 'Thermal cracking observed'
        }
      ] : []
    }

    const { error } = await supabase
      .from('inspection_photos')
      .update({
        has_damage: mockAnalysis.has_damage,
        damage_types: mockAnalysis.damage_types,
        ai_confidence: mockAnalysis.confidence,
        analysis_completed_at: new Date().toISOString()
      })
      .eq('id', photoId)

    if (error) throw error

    return { ...mockAnalysis, photoId }
  }

  private calculateRiskAssessment(photoAnalyses: AIImageAnalysis[]): RiskAssessment {
    const totalDamage = photoAnalyses.reduce((sum, analysis) => 
      sum + analysis.annotations.length, 0)
    
    const highSeverityCount = photoAnalyses.reduce((sum, analysis) =>
      sum + analysis.annotations.filter(a => a.severity === 'high').length, 0)
    
    const avgConfidence = this.calculateAverageConfidence(photoAnalyses)
    
    let riskScore = 0
    riskScore += totalDamage * 5
    riskScore += highSeverityCount * 15
    riskScore += (100 - avgConfidence) * 0.5
    
    riskScore = Math.min(Math.max(riskScore, 1), 100)
    
    let riskLevel: 'low' | 'medium' | 'high'
    let repairUrgency: 'immediate' | 'within_30_days' | 'within_6_months' | 'monitor'
    
    if (riskScore < 40) {
      riskLevel = 'low'
      repairUrgency = 'monitor'
    } else if (riskScore < 70) {
      riskLevel = 'medium'
      repairUrgency = 'within_6_months'
    } else {
      riskLevel = 'high'
      repairUrgency = riskScore > 85 ? 'immediate' : 'within_30_days'
    }

    const baseRepairCost = 500 + (totalDamage * 200) + (highSeverityCount * 500)
    const baseReplacementCost = baseRepairCost * 4

    return {
      overall_risk_score: Math.round(riskScore),
      risk_level: riskLevel,
      repair_urgency: repairUrgency,
      estimated_repair_cost: baseRepairCost,
      estimated_replacement_cost: baseReplacementCost,
      factors: [
        { label: 'Structural Integrity', score: Math.max(0, 100 - riskScore), status: riskLevel },
        { label: 'Water Intrusion Risk', score: riskScore, status: riskLevel },
        { label: 'Remaining Lifespan', score: Math.max(0, 100 - Math.round(riskScore * 0.8)), status: riskLevel },
        { label: 'Storm Resistance', score: Math.max(0, 100 - Math.round(riskScore * 0.6)), status: riskLevel }
      ]
    }
  }

  private calculateAverageConfidence(photoAnalyses: AIImageAnalysis[]): number {
    if (photoAnalyses.length === 0) return 0
    const sum = photoAnalyses.reduce((acc, analysis) => acc + analysis.confidence, 0)
    return Math.round(sum / photoAnalyses.length)
  }
}