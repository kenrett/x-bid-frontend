# Domains (Frontend)

## Required API origin

Production storefronts must use:

- `https://api.biddersweet.app`

This is required for:

- Cookie-based auth across storefronts (shared registrable domain).
- ActionCable connections on the same host (`wss://api.biddersweet.app/cable`).
- Consistent session hydration via `/api/v1/logged_in` on app boot.

## Environment variables

- `VITE_API_BASE_URL`
  - Base API origin. Production should be `https://api.biddersweet.app`.
  - All storefronts must point at the same API host to preserve SSO.
- `VITE_CABLE_URL` (optional)
  - Overrides the ActionCable endpoint. If unset, derived from `VITE_API_BASE_URL`.

## Notes

- Do not use `https://x-bid-backend.onrender.com` in production.
- Keep dev/preview pointed at local or preview backends as needed.
