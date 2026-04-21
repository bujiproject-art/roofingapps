import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address')
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
export const addressSchema = z.object({
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().length(2),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')
})

export const propertySchema = z.object({
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().length(2),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/),
  roof_type: z.enum(['shingles', 'tpo', 'epdm', 'metal', 'flat', 'other']),
  roof_age: z.number().min(0).max(200).optional(),
  square_feet: z.number().min(0).optional(),
})

export const clientSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  preferred_contact: z.enum(['sms', 'email', 'both']),
})

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}