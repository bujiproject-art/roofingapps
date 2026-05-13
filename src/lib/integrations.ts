// Integration utilities for third-party services

import twilio from 'twilio'
import sgMail from '@sendgrid/mail'
import Stripe from 'stripe'
import AWS from 'aws-sdk'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' })
const s3 = new AWS.S3({ region: process.env.AWS_REGION })
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function sendSMS(to: string, body: string) {
  return twilioClient.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to })
}

export async function sendEmail(to: string, subject: string, html: string) {
  const msg = { to, from: process.env.SENDGRID_FROM_EMAIL!, subject, html }
  return sgMail.send(msg)
}

export async function createStripeSubscription(customerId: string, priceId: string) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function uploadToS3(bucket: string, key: string, body: Buffer) {
  return s3.upload({ Bucket: bucket, Key: key, Body: body }).promise()
}