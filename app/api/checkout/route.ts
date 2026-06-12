import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = session.user.email;

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  if (!baseUrl || !baseUrl.startsWith('https://')) {
    console.error('NEXT_PUBLIC_URL is not set or is not a valid https:// URL');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
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
            unit_amount: 800,
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

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('Stripe checkout session creation failed', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
