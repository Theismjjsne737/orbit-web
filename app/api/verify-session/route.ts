import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

// Stripe checkout session IDs are prefixed cs_test_ or cs_live_
const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{20,}$/;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }
  if (!SESSION_ID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session_id format' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('Stripe session retrieval failed', err);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 502 });
  }

  if (stripeSession.payment_status !== 'paid' && stripeSession.status !== 'complete') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
  }

  // Verify the session belongs to the authenticated user
  if (stripeSession.customer_email && stripeSession.customer_email !== session.user.email) {
    return NextResponse.json({ error: 'Session does not belong to authenticated user' }, { status: 403 });
  }

  return NextResponse.json({
    email: session.user.email,
    customerId: stripeSession.customer,
    subscriptionId: stripeSession.subscription,
    plan: 'pro',
  });
}
