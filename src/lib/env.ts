// Environment variable validation - run at app startup

const requiredServerEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'STRIPE_SECRET_KEY',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
] as const

const requiredClientEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export function validateEnv() {
  if (typeof window !== 'undefined') return // Only run server-side
  
  const missing: string[] = []
  
  for (const envVar of requiredServerEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env.local file.`
    )
  }
  
  console.log('✅ All required environment variables are set')
}

export function validateClientEnv() {
  const missing: string[] = []
  
  for (const envVar of requiredClientEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing client environment variables: ${missing.join(', ')}`)
  }
}

// Auto-validate on import in server contexts
if (typeof window === 'undefined') {
  validateEnv()
}