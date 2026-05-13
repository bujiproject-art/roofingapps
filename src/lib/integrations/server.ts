// Server-side only integrations - NEVER import in client components
'use server'

import twilio from 'twilio'
import sgMail from '@sendgrid/mail'
import Stripe from 'stripe'
import AWS from 'aws-sdk'

// Validate env vars on load
if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY missing')
if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing')
if (!process.env.TWILIO_ACCOUNT_SID) throw new Error('TWILIO_ACCOUNT_SID missing')
if (!process.env.TWILIO_AUTH_TOKEN) throw new Error('TWILIO_AUTH_TOKEN missing')
if (!process.env.AWS_REGION) throw new Error('AWS_REGION missing')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
const s3 = new AWS.S3({ 
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function sendSMS(to: string, body: string) {
  'use server'
  return twilioClient.messages.create({ 
    body, 
    from: process.env.TWILIO_PHONE_NUMBER, 
    to 
  })
}

export async function sendEmail(to: string, subject: string, html: string) {
  'use server'
  const msg = { 
    to, 
    from: process.env.SENDGRID_FROM_EMAIL!, 
    subject, 
    html 
  }
  return sgMail.send(msg)
}

export async function createStripeSubscription(customerId: string, priceId: string) {
  'use server'
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function uploadToS3(bucket: string, key: string, body: Buffer, contentType: string) {
  'use server'
  return s3.upload({ 
    Bucket: bucket, 
    Key: key, 
    Body: body,
    ContentType: contentType 
  }).promise()
}

export async function getSignedS3Url(bucket: string, key: string, expiresIn: number = 3600) {
  'use server'
  return s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: expiresIn })
}