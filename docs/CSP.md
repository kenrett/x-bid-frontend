# Content Security Policy (CSP)

This project enforces a strict, minimal CSP. Each allowed source is required for specific functionality:

- `default-src 'self'`
  - Baseline; disallows all third‑party loads unless explicitly allowed elsewhere.

- `script-src 'self' https://js.stripe.com https://static.cloudflareinsights.com`
  - `https://js.stripe.com` — Stripe Elements/Checkout loader.
  - Cloudflare Web Analytics is intentionally not allowed by default.

- `style-src 'self'`
  - All styles are locally served/bundled.

- `connect-src 'self' https://x-bid-backend.onrender.com wss://x-bid-backend.onrender.com http://localhost:3000 ws://localhost:3000 https://api.stripe.com https://m.stripe.network`
  - Backend REST/WebSocket in prod (`https://x-bid-backend.onrender.com`, `wss://x-bid-backend.onrender.com`).
  - Backend in local dev (`http://localhost:3000`, `ws://localhost:3000`).
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

## Cloudflare JS challenge injection (breaks strict CSP)

If Cloudflare is configured to inject a JS challenge (for example `/cdn-cgi/challenge-platform/scripts/jsd/main.js`), it typically does so by adding an inline `<script>` block to the HTML document. A strict CSP without `'unsafe-inline'` (or a matching nonce/hash) will block that inline script and produce console errors.

Because Cloudflare changes the injected inline script content per-request, hashing it is not practical; the fix is to disable/bypass the JS challenge for this site (or for Lighthouse/monitoring traffic) at the Cloudflare layer.
