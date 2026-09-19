import { NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * The introduction fee: the vendor pays when a meeting is accepted, and only then.
 *
 * This is the business model made concrete — the platform charges for an accepted meeting, not
 * for a lead and not by subscription, which is the one arrangement where spamming a buyer earns
 * a vendor nothing (docs/RESEARCH.md §4.4). Money changes hands at the moment the briefing is
 * handed over, before either side has the other's contact details.
 *
 * Post a form to /api/checkout and the browser lands on Stripe's hosted page:
 *   <form action="/api/checkout" method="post"><button>Accept and pay</button></form>
 *
 * Test mode only. See STRIPE_INTEGRATION_TODO.md for what is still a placeholder.
 */

/** What an accepted introduction costs the vendor. A real price lives in the Dashboard. */
const FEE_CENTS = 4900;

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured on this deployment' }, { status: 503 });
  }

  // Built per request, after the key check: `new Stripe('')` throws, and at module level that
  // throw fails `next build` on any deployment without the key. Deliberately no apiVersion: the
  // SDK pins the one it was built against.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = process.env.DOMAIN ?? new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'hosted_page',
      mode: 'payment',
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      submit_type: 'auto',
      name_collection: { business: { enabled: true } },
      locale: 'en',
      integration_identifier: 'hosted_web_0001',
      origin_context: 'web',
      success_url: `${origin}/matches?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/matches`,
      line_items: [
        {
          quantity: 1,
          // Inline rather than a Price ID so the flow works before anything is set up in the
          // Dashboard. Swap it for a real price — see STRIPE_INTEGRATION_TODO.md.
          price_data: {
            currency: 'eur',
            unit_amount: FEE_CENTS,
            product_data: {
              name: 'Crossdesk introduction fee',
              description: 'Charged once, when a meeting is accepted by both sides.',
            },
          },
        },
      ],
    });

    if (!session.url) throw new Error('Stripe returned a session without a URL');
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error('[stripe]', e);
    return NextResponse.json({ error: 'Could not start the payment' }, { status: 502 });
  }
}
