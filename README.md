# XBid Frontend

This is the frontend for XBid, a penny auction web application built with React. It provides a dynamic and real-time user interface for browsing auctions, placing bids, and managing user accounts.

## ✨ Features

-   **Real-time Bidding:** Live auction updates using Action Cable WebSockets.
-   **User Authentication:** Secure login and registration for users.
-   **Auction Listings:** View all active, scheduled, and completed auctions.
-   **Detailed Auction View:** In-depth look at individual auctions with bid history.
-   **Responsive Design:** Styled with Tailwind CSS for a seamless experience on all devices.

## 🛠️ Tech Stack

-   **Framework:** [React](https://reactjs.org/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Routing:** [React Router](https://reactrouter.com/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Real-time Communication:** [Action Cable](https://guides.rubyonrails.org/action_cable_overview.html)
-   **HTTP Client:** [Axios](https://axios-http.com/)

## 🚀 Getting Started

### Prerequisites

Make sure you have a running instance of the corresponding [XBid backend API](https://github.com/kenrettberg/x-bid-backend).

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

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

    Create a `.env` file in the root of the project and add the URLs for your backend API and Action Cable server.

    ```env
    # .env
    VITE_API_URL=http://localhost:3000
    VITE_CABLE_URL=ws://localhost:3000/cable
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📜 Available Scripts

-   `npm run dev`: Starts the development server with Hot Module Replacement.
-   `npm run build`: Bundles the app for production.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run preview`: Serves the production build locally for preview.

## 🧱 Architecture

### Error Handling with `ErrorBoundary`

This application uses a global `ErrorBoundary` component to catch and gracefully handle JavaScript errors that occur during rendering in any part of the component tree. This prevents the entire application from crashing and provides a user-friendly fallback UI.

#### Features

*   **Graceful Fallback UI**: Displays a clean, user-friendly error screen instead of a white page.
*   **Error Logging**: Automatically logs errors to the console and is configured to send them to an external monitoring service (see `src/services/logger.ts`).
*   **Recovery Options**: Provides "Try Again" and "Reload Page" buttons to allow users to recover from the error state.
*   **Route-based Reset**: The error boundary automatically resets when the user navigates to a new page, allowing them to continue using other parts of the application.

#### Usage

To ensure it covers the entire application, the `ErrorBoundary` wraps the main `<App />` component within the application's entry point (`src/main.tsx`).

By providing a unique `key` to the `ErrorBoundary` that changes with the location, we ensure that if a user navigates away from a broken route, the error boundary component is re-mounted, clearing the error state.

Here is the integration example from `src/main.tsx`:

```tsx
import { BrowserRouter, useLocation } from 'react-router-dom';

const AppWrapper = () => {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  );
};
```
