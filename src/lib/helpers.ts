// Helper functions for computed values and transformations

export function computeOverallRiskScore(analyses: Array<{ severity: string }>): number {
  const total = analyses.length
  const highRisk = analyses.filter(a => a.severity === 'high').length
  return (highRisk / total) * 100
}

export function transformDamageData(data: any): any {
  return {
    ...data,
    severity: data.severity.toUpperCase(),
    description: data.description || 'No description provided',
  }
}