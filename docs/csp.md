# Content Security Policy (CSP)

This app uses an environment-aware CSP:

- Development: allows localhost + ws://localhost for Vite dev server and HMR.
- Production: strict, no localhost entries.

## Source of truth

The canonical CSP definition lives in `src/config/csp.ts` and is used by:

- Vite dev server headers (development CSP).
- Vite preview headers (production CSP for e2e/smoke).
- Tests that ensure `vercel.json` stays aligned with production CSP.

`vercel.json` must match the production CSP because Vercel headers are static at deploy time.

## Updating allowed origins

1. Edit `src/config/csp.ts`:
   - Add new allowed origins to the relevant directive list.
   - Keep dev-only allowances inside the `env === "development"` blocks.
2. Update `vercel.json`:
   - Replace the `Content-Security-Policy` value with the output of
     `getCsp({ env: "production" })`.
3. Run tests:
   - `npm test` should pass and confirm no localhost entries in production.

## Notes

- `connect-src` includes the API origin, websocket origin, Stripe endpoints, and Cloudflare Insights.
- `img-src` includes data/blob URLs, the API origin, and robohash.
- If you introduce a CDN or new external asset host, add it to `img-src` (and `connect-src` if needed).
