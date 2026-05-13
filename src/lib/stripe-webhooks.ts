// Stripe webhook handling for subscription events

import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sig = req.headers['stripe-signature']!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'customer.subscription.created':
      // Handle subscription creation
      break
    case 'customer.subscription.updated':
      // Handle subscription update
      break
    case 'customer.subscription.deleted':
      // Handle subscription deletion
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
}