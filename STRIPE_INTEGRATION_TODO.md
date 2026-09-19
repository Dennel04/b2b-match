# Stripe integration — what is done and what is left

Hosted Stripe Checkout, in **test mode**. A vendor pays an introduction fee when a meeting is
accepted — the one point in the flow where the platform has delivered something (a briefing, a
counterparty who already agreed) and before either side has the other's contact details. That is
the business model from `docs/RESEARCH.md` §4.4: paid per accepted meeting, never per lead, so
spamming a buyer earns a vendor nothing.

Verified: a live test-mode session was created against these keys (€49, hosted page opened).

## Values to Replace

The following values are placeholders and must be updated before this is anything but a demo.

**Files containing placeholders:**
- [src/app/api/checkout/route.ts](src/app/api/checkout/route.ts)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| `line_items[].price_data` | inline €49.00 "Crossdesk introduction fee" | A real Price ID from the Dashboard (https://dashboard.stripe.com/prices), passed as `price: 'price_...'`. Inline `price_data` is used so the flow works before anything is configured; a real product belongs in the Dashboard. |
| `mode` | `payment` | Correct for a one-time introduction fee. Change to `subscription` only if the model becomes recurring — and then add `payment_method_collection: 'always'`, which is deliberately absent for a one-time charge. |
| `success_url` | `${origin}/matches?paid={CHECKOUT_SESSION_ID}` | A real post-payment screen. Keep the `{CHECKOUT_SESSION_ID}` template. |
| `cancel_url` | `${origin}/matches` | Wherever a vendor should land after backing out. |
| `FEE_CENTS` | `4900` | What an introduction is actually worth. `docs/RESEARCH.md` §7.2 assumes €50–200. |

## Configured Parameters

Set in Checkout Studio and already correct in the code — do not edit these by hand.

**Files containing these parameters:**
- [src/app/api/checkout/route.ts](src/app/api/checkout/route.ts)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `hosted_page` (the SDK here is stripe 22.6.2; below 21.0.0 this would be `hosted`) |
| `billing_address_collection` | `auto` |
| `phone_number_collection` | `{ enabled: false }` |
| `automatic_tax` | `{ enabled: false }` |
| `allow_promotion_codes` | `false` |
| `submit_type` | `auto` |
| `name_collection` | `{ business: { enabled: true } }` |
| `locale` | `en` |
| `integration_identifier` | `hosted_web_0001` |
| `origin_context` | `web` |

`payment_method_collection` is **not** set: it belongs to `mode: 'subscription'`, and this is a
one-time charge.

## Setup

Environment variables, in `.env.local` locally and in **Vercel → Settings → Environment
Variables** for the deployment — the deployed site has no fallback if they are missing, it
answers 503:

```
STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_SECRET_KEY=sk_test_…       # server only, never NEXT_PUBLIC_
DOMAIN=https://<the deployed host> # used for success_url and cancel_url
```

`DOMAIN` is optional: without it the route uses the origin of the request, which is right in
development and right on Vercel.

The dependency is already installed (`stripe` in `package.json`). Nothing else was added — no
webhook handler, no new middleware, no database columns.

## How it works

1. A vendor accepts a meeting on a match screen.
2. The screen posts a plain form to `POST /api/checkout` — no JavaScript needed:
   ```html
   <form action="/api/checkout" method="post">
     <button type="submit">Accept and pay the introduction fee</button>
   </form>
   ```
3. The route creates a Checkout Session server-side and answers `303` to Stripe's hosted page.
4. Stripe takes the card and returns the vendor to `success_url`.

## Testing

Test mode accepts these cards with any future expiry, any CVC, any postcode:

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | succeeds |
| `4000 0000 0000 9995` | declined, insufficient funds |
| `4000 0025 0000 3155` | requires 3D Secure authentication |

Sessions appear at https://dashboard.stripe.com/test/payments.

## Next steps, in the order they matter

1. **Tie the charge to a match.** `POST /api/checkout` currently charges a flat fee with no idea
   which meeting it is for. Pass the match id and put it in the session's `metadata`, so a
   payment can be traced to the introduction it paid for.
2. **Fulfilment.** Nothing happens after a successful payment: `matches.status` is not written,
   and a vendor who pays twice is charged twice. This needs a webhook on
   `checkout.session.completed` that marks the introduction paid — the endpoint does not exist.
3. **A real product and price** in the Dashboard, replacing the inline `price_data`.
4. **Live keys**, once there is anything to charge for.

## Resources

- https://docs.stripe.com/payments/checkout
- https://docs.stripe.com/mcp
- https://support.stripe.com
