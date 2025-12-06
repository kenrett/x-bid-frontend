# XBid Frontend

This is the frontend for XBid, a penny auction web application built with React. It provides a dynamic and real-time user interface for browsing auctions, placing bids, and managing user accounts.

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
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

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

    ```env
    cp .env.example .env.development
    ```

    - `VITE_API_URL`: Base URL for the XBid backend API (e.g., `http://localhost:3000/api/v1`).
    - `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key used for embedded checkout.
    - `VITE_CABLE_URL` (optional): Action Cable WebSocket endpoint; defaults to `ws://localhost:3000/cable`.

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

### Maintenance Mode

- Superadmin can toggle maintenance in Admin Settings; uses `/api/v1/admin/maintenance` behind the scenes.
- When the backend returns 503, the app redirects to `/maintenance` and polls until maintenance is cleared, then returns to `/auctions`.
