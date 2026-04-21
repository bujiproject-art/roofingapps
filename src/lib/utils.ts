// Utility functions for data validation and transformation

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function calculateAge(birthDate: Date): number {
  const ageDifMs = Date.now() - birthDate.getTime()
  const ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}