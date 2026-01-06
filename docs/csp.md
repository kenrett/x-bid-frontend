# Content Security Policy (CSP)

The CSP is defined in `vercel.json` and is intentionally strict (no `unsafe-inline`).

## Why each allowed domain exists

- `default-src 'self'`
  - Disallow all third-party loads unless explicitly allowed.

- `script-src 'self' https://js.stripe.com` and `script-src-elem 'self' https://js.stripe.com`
  - `https://js.stripe.com` is required for Stripe’s loader (`/v3`) used by checkout.

- `style-src 'self'`
  - All styles are bundled and served from our origin.

- `connect-src 'self' ...`
  - `https://x-bid-backend.onrender.com` and `wss://x-bid-backend.onrender.com` for production API + ActionCable.
  - `http://localhost:3000` and `ws://localhost:3000` for local backend development.
  - `https://api.stripe.com`, `https://m.stripe.network`, `https://hooks.stripe.com` for Stripe checkout API + telemetry flows.

- `img-src 'self' data: https://robohash.org`
  - App images, data URLs, and robohash avatars.

- `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com`
  - Stripe-hosted iframes needed for embedded checkout.

- `frame-ancestors 'none'`
  - Prevent clickjacking by disallowing embedding.

- `base-uri 'none'`
  - Prevent base tag injection.

- `form-action 'self'`
  - Restrict form submissions to our origin.

## Adding a new third party

Before adding any new CSP host, identify exactly which directive needs it (`script-src`, `connect-src`, `frame-src`, etc.) and document the justification here.
