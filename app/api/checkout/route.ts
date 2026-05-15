import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Orbit Pro',
            description: 'Unlimited AI subscription tracking',
          },
          unit_amount: 800, // $8.00
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}?upgrade=cancelled`,
    subscription_data: {
      metadata: { email },
    },
  });

  return NextResponse.json({ url: session.url });
}
