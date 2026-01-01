# Content Security Policy (CSP)

This project enforces a strict, minimal CSP. Each allowed source is required for specific functionality:

- `default-src 'self'`
  - Baseline; disallows all third‑party loads unless explicitly allowed elsewhere.

- `script-src 'self' https://js.stripe.com https://static.cloudflareinsights.com`
  - `https://js.stripe.com` — Stripe Elements/Checkout loader.
  - `https://static.cloudflareinsights.com` — Cloudflare Web Analytics script.

- `style-src 'self'`
  - All styles are locally served/bundled.

- `connect-src 'self' https://x-bid-backend.onrender.com wss://x-bid-backend.onrender.com http://localhost:3000 ws://localhost:3000 https://cloudflareinsights.com https://api.stripe.com https://m.stripe.network`
  - Backend REST/WebSocket in prod (`https://x-bid-backend.onrender.com`, `wss://x-bid-backend.onrender.com`).
  - Backend in local dev (`http://localhost:3000`, `ws://localhost:3000`).
  - Cloudflare analytics beacons (`https://cloudflareinsights.com`) and supporting endpoints (`https://static.cloudflareinsights.com`).
  - Stripe APIs/telemetry (`https://api.stripe.com`, `https://m.stripe.network`).

- `img-src 'self' data: https://robohash.org`
  - Local/static assets, inline data URLs, and robohash avatars (`https://robohash.org`).

- `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`
  - Stripe-hosted iframes for Elements/Checkout (`https://js.stripe.com`, `https://hooks.stripe.com`).
  - Prevents other embeds.

- `frame-ancestors 'none'`
  - Disallow the app from being embedded.

- `base-uri 'none'`
  - Prevent base tag injection attacks.

- `form-action 'self'`
  - Restrict form submissions to our origin.

If adding a new third-party, document its exact requirement here before updating the policy.

## Cloudflare Insights injection

This repo does not include a Cloudflare Insights `<script>` tag in `index.html`. If Cloudflare Web Analytics is enabled, the script is typically injected by the hosting/proxy layer; CSP must allow the script origin and its beacon endpoints.
