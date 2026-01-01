# XBid Frontend

This is the frontend for XBid, a penny auction web application built with React. It provides a dynamic and real-time user interface for browsing auctions, placing bids, and managing user accounts.

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

    - `VITE_API_URL`: Base URL for the XBid backend API origin (e.g., `http://localhost:3000`). (Frontend requests include `/api/v1/...` in their paths.)
    - `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key used for embedded checkout.
    - `VITE_CABLE_URL` (optional): Action Cable WebSocket endpoint; defaults to `ws://localhost:3000/cable`. The app includes the session token as a `?token=...` query param (and adds an `Authorization` header in Node/WebSocket test environments when supported).
    - `VITE_AUTH_REFRESH_WITH_COOKIE` (optional): Set to `"true"` to enable cookie-based refresh (`POST /api/v1/session/refresh` with `withCredentials: true`) on `401` responses; otherwise a reload (or `401`) requires re-login.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📜 Available Scripts

- `npm run dev`: Starts the development server with Hot Module Replacement.
- `npm run build`: Bundles the app for production.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run test`: Runs the Vitest suite in watch mode (see `src/test/setup.ts` for the shared test setup).
- `npm run test:ci`: Executes the Vitest suite once for CI environments.
- `npm run preview`: Serves the production build locally for preview after `npm run build`.

## 🧱 Architecture

### Admin & Access Control

- Admin screens require `is_admin` or `is_superuser` from the auth payload; superadmin-only actions (admin user management, maintenance) are gated in the UI.
- Audit logging is fire-and-forget via `/api/v1/admin/audit` (backend also logs common admin actions automatically). Errors surface as toasts only.

### Password Recovery

- Forgot password: `/api/v1/password/forgot` with `email_address`, always shows a generic success message.
- Reset password: `/api/v1/password/reset` with token + new password. Errors (401/403/422) are surfaced inline.

### Authentication & API Contracts

- HTTP requests send `Authorization: Bearer <token>` only when an in-memory token exists. ActionCable/WebSocket auth uses `?token=...` (browsers can’t set custom headers in the WebSocket handshake).
- Optional cookie-based refresh (when enabled) uses `withCredentials: true` only for `POST /api/v1/session/refresh`.
- Login (example): `POST /api/v1/login` with `{ "session": { "email_address": "...", "password": "..." } }` returns `token`, `refresh_token`, `session` (`session_token_id`, `session_expires_at`, `seconds_remaining`), `is_admin`, `is_superuser`, optional `redirect_path`, and `user`.
- Error shapes tolerated: `{error_code, message, details?}` (preferred), `{error: "text"}`, or `{error: {code, message}}` (rack-attack/throttling). Use `message` for user feedback when present.

### Maintenance Mode

- Superadmin can toggle maintenance in Admin Settings; uses `/api/v1/admin/maintenance` behind the scenes.
- When the backend returns 503, the app redirects to `/maintenance` and polls until maintenance is cleared, then returns to `/auctions`.
