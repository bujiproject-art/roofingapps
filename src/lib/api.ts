// API routes for handling requests and responses

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AIAnalysisService } from '@/lib/ai/analysis'

const supabase = createClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { inspectionId } = req.body

    try {
      const analysisService = AIAnalysisService.getInstance()
      await analysisService.analyzeInspection(inspectionId)
      res.status(200).json({ message: 'Analysis complete' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze inspection' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}