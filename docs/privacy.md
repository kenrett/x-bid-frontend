# Privacy notes (third parties)

## Stripe payments

X-Bid uses Stripe to process payments for bid pack purchases and related checkout flows.

- **Where it loads:** Stripe resources are only loaded on checkout-related routes (for example `/buy-bids`). We do not intentionally load Stripe on the homepage (`/`).
- **What Stripe receives:** When you check out, Stripe may receive payment and device information necessary to process the transaction and help detect fraud.
- **Cookies/identifiers:** Stripe may set cookies or similar identifiers (including on `js.stripe.com` and related Stripe domains) for fraud prevention and payment processing.
- **Learn more:** https://stripe.com/privacy
