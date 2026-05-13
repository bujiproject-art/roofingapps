// Stripe payment handling and subscription management

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' })

export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name })
}

export async function createSubscription(customerId: string, priceId: string) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.del(subscriptionId)
}