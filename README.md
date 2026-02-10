# XBid Frontend

This is the frontend for BidderSweet, a penny auction web application built with React. It provides a dynamic and real-time user interface for browsing auctions, placing bids, and managing user accounts.

## 📚 Documentation

- [Development runbook](DEV-RUN.md)
- [Session lifecycle contract](SESSION-LIFECYCLE.md)
- [Accessibility conventions](docs/A11Y.md)

## ✨ Features

- **Real-time Bidding:** Live auction updates using Action Cable WebSockets.
- **User Authentication:** Secure login and registration for users.
- **Admin Console:** Manage auctions, bid packs, users, payments, and site settings.
- **Bid Purchases:** Stripe-powered embedded checkout for buying bid packs.
- **Password Recovery:** Forgot/reset password flows wired to backend tokens.
- **Maintenance Mode:** Superadmin toggle to take the site offline with a branded splash page and automatic redirect back when re-enabled.
- **Auction Listings:** View all active, scheduled, and completed auctions.
- **Detailed Auction View:** In-depth look at individual auctions with bid history.
- **Responsive Design:** Styled with Tailwind CSS for a seamless experience on all devices.

## 🛠️ Tech Stack

- **Framework:** [React](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router](https://reactrouter.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Real-time Communication:** [Action Cable](https://guides.rubyonrails.org/action_cable_overview.html)
- **HTTP Client:** [Axios](https://axios-http.com/)

## 🚀 Getting Started

### Prerequisites

Make sure you have a running instance of the corresponding [XBid backend API](https://github.com/kenrettberg/x-bid-backend).

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (this repo uses `package-lock.json`)

### Installation & Setup

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/kenrettberg/x-bid-frontend.git
    cd x-bid-frontend
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Copy the example environment file and fill in the required values. You will need a Stripe publishable key for development.

    ```sh
    cp .env.example .env.development
    ```

    - `VITE_API_BASE_URL`: Base URL for the XBid backend API origin (e.g., `http://api.lvh.me:3000`). (Frontend requests include `/api/v1/...` in their paths.) All storefronts should point to the same API host for shared sessions.
    - `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key used for embedded checkout.
    - `VITE_CABLE_URL` (optional): Action Cable WebSocket endpoint; if unset, it is derived from `VITE_API_BASE_URL` as `ws(s)://<api-host>/cable`. The client appends the current JWT and storefront key as query params (`?token=...&storefront=...`). All storefronts should point at the same cable host.
    - `VITE_AUTH_REFRESH_WITH_COOKIE` (optional): Set to `"true"` to enable cookie-based refresh (`POST /api/v1/session/refresh` with `withCredentials: true`) on `401` responses; otherwise a reload (or `401`) requires re-login.
    - `VITE_STOREFRONT_KEY` (dev-only, optional): Overrides storefront selection in dev/test. Production storefront selection is runtime/hostname-based.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://main.lvh.me:5173`.

## 📜 Available Scripts

- `npm run dev`: Starts the development server with Hot Module Replacement.
- `npm run build`: Bundles the app for production.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run test`: Runs the Vitest suite in watch mode (see `src/test/setup.ts` for the shared test setup).
- `npm run test:ci`: Executes the Vitest suite once for CI environments.
- `npm run test:e2e`: Runs the Playwright end-to-end suite.
- `npm run test:e2e:prod-smoke`: Runs read-only Playwright smoke checks against all configured prod storefront targets.
- `npm run test:e2e:prod-smoke:fast`: Runs `@p0` prod smoke checks.
- `npm run test:e2e:prod-smoke:standard`: Runs `@p0` + `@p1` prod smoke checks.
- `npm run test:e2e:prod-smoke:deep`: Runs full prod smoke checks (`@p0` + `@p1` + `@p2`).
  - Includes `public-access-diagnostic.json` artifact per storefront run for route access outcomes.
  - Set `PROD_SMOKE_TARGETS` to override storefront URLs, e.g. `main=https://www.biddersweet.app,afterdark=https://afterdark.biddersweet.app,marketplace=https://marketplace.biddersweet.app`.
  - Set `PROD_SMOKE_STRICT_CSP=true` to fail on known inline-script CSP violations.
  - Set `PROD_SMOKE_STRICT_PERF=true` to fail on slow critical responses (threshold via `PROD_SMOKE_SLOW_MS`, default `3000`).
  - Set `PROD_SMOKE_AUCTIONS_TIMEOUT_MS` to tune auctions-list settle timeout (default `45000`).
- `npm run test:e2e:mutating-smoke`: Runs mutating Playwright smoke checks with `playwright.mutating-smoke.config.ts`.
- `npm run test:e2e:mutating-smoke:prod`: Runs mutating smoke checks with explicit prod opt-in enabled.
  - Mutating smoke checks only run files matching `**/*.mutating-smoke.spec.ts`.
  - Targets default to `PROD_SMOKE_TARGETS`; you can override with `MUTATING_SMOKE_TARGETS` using the same format (`key=https://host,key2=https://host2`).
  - If any target is on `biddersweet.app`, runs are blocked unless `MUTATING_SMOKE_ALLOW_PROD=true`.
  - Keep this lane manual/nightly while prod is the active target, and use dedicated smoke credentials.
- `npm run preview`: Serves the production build locally for preview after `npm run build`.

## 🧱 Architecture

### App Modes (Storefront vs Account)

This frontend can be built in two modes via `VITE_APP_MODE`:

- `VITE_APP_MODE=storefront` (default): full auction storefront experience.
- `VITE_APP_MODE=account`: restricted experience intended for `account.biddersweet.app` (login/signup + wallet + basic profile).

Build example:

- `VITE_APP_MODE=account npm run build`

Note: Vite `VITE_*` env vars are baked at build time, so production typically builds separate artifacts/images per mode. There is a hostname-based runtime fallback intended for local/dev only.

### Storefront Selection & Theming

Storefront selection is runtime-only and based on `window.location.hostname`:

- `www.biddersweet.app` → `main`
- `afterdark.biddersweet.app` → `afterdark`
- `marketplace.biddersweet.app` → `marketplace`

The app sets `document.documentElement.dataset.storefront` at bootstrap and applies theme tokens from `STOREFRONT_CONFIGS` (see `src/storefront/storefront.ts`). To test locally, use one of the dev scripts (e.g., `npm run dev:afterdark`) or map hosts in `/etc/hosts` and run `vite --host <subdomain>.lvh.me`.

If you need to force a storefront in dev/tests, set `VITE_STOREFRONT_KEY` to `main`, `afterdark`, or `marketplace`. This override is ignored in production.

### Admin & Access Control

- Admin screens require `is_admin` or `is_superuser` from the auth payload; superadmin-only actions (admin user management, maintenance) are gated in the UI.
- Audit logging is fire-and-forget via `/api/v1/admin/audit` (backend also logs common admin actions automatically). Errors surface as toasts only.

### Password Recovery

- Forgot password: `/api/v1/password/forgot` with `email_address`, always shows a generic success message.
- Reset password: `/api/v1/password/reset` with token + new password. Errors (401/403/422) are surfaced inline.

### Authentication & API Contracts

- HTTP requests send `Authorization: Bearer <token>` only when an in-memory token exists. ActionCable/WebSocket auth uses `?token=...` (browsers can’t set custom headers in the WebSocket handshake).
- Optional cookie-based refresh (when enabled) uses `withCredentials: true` only for `POST /api/v1/session/refresh`.
- Login (example): `POST /api/v1/login` with `{ "session": { "email_address": "...", "password": "..." } }` returns `access_token`, `refresh_token`, `session_token_id`, and `user` (plus optional flags depending on backend contract).
- Error shapes tolerated: `{error_code, message, details?}` (preferred), `{error: "text"}`, or `{error: {code, message}}` (rack-attack/throttling). Use `message` for user feedback when present.

### Maintenance Mode

- Superadmin can toggle maintenance in Admin Settings; uses `/api/v1/admin/maintenance` behind the scenes.
- When the backend returns 503, the app redirects to `/maintenance` and polls until maintenance is cleared, then returns to `/auctions`.

## OpenAPI types generation

This repo generates `src/api/openapi-types.ts` from a backend-provided OpenAPI spec. You must provide the spec via one of:

- `OPENAPI_SPEC_PATH=/path/to/openapi.json` (preferred)
- `OPENAPI_URL=https://…/openapi.json`

Commands:

- Generate types: `npm run gen:api-types`
- Verify types are up to date (CI uses this): `npm run check:api-types`
