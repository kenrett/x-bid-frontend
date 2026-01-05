import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RouteErrorBoundary } from "./components/ErrorBoundary/RouteErrorBoundary";
import { ADMIN_PATHS } from "@features/admin/components/Admin/adminPaths";

const lazy =
  (importer: () => Promise<unknown>, exportName?: string) => async () => {
    const mod = (await importer()) as Record<string, unknown>;
    const Component = (exportName ? mod[exportName] : mod.default) as
      | ComponentType
      | undefined;
    if (!Component) throw new Error("Lazy route component missing export");
    return { Component };
  };

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/",
        lazy: lazy(
          () => import("@features/auctions/components/AuctionList/AuctionList"),
          "default",
        ),
      },
      {
        path: "/auctions",
        lazy: lazy(
          () => import("@features/auctions/components/AuctionList/AuctionList"),
          "default",
        ),
      },
      {
        path: "/auctions/:id",
        lazy: lazy(
          () => import("@features/auctions/components/AuctionDetail"),
          "AuctionDetail",
        ),
      },
      {
        path: "/login",
        lazy: lazy(
          () => import("@features/auth/components/LoginForm/LoginForm"),
          "LoginForm",
        ),
      },
      {
        path: "/signup",
        lazy: lazy(
          () => import("@features/auth/components/SignUpForm/SignUpForm"),
          "SignUpForm",
        ),
      },
      {
        path: "/forgot-password",
        lazy: lazy(
          () => import("@features/auth/components/Auth/ForgotPassword"),
          "ForgotPassword",
        ),
      },
      {
        path: "/reset-password",
        lazy: lazy(
          () => import("@features/auth/components/Auth/ResetPassword"),
          "ResetPassword",
        ),
      },
      {
        path: "/about",
        lazy: lazy(() => import("./components/About/About"), "About"),
      },
      {
        path: "/how-it-works",
        lazy: lazy(() => import("./components/HowItWorks"), "HowItWorks"),
      },
      {
        path: "/buy-bids",
        lazy: lazy(
          () => import("@features/auctions/components/BuyBids/BuyBids"),
          "BuyBids",
        ),
      },
      {
        path: "/purchase-status",
        lazy: lazy(
          () => import("@features/auctions/components/BuyBids/PurchaseStatus"),
          "PurchaseStatus",
        ),
      },
      {
        path: "/account",
        lazy: lazy(
          () => import("@features/account/components/AccountRoute"),
          "AccountRoute",
        ),
        children: [
          {
            lazy: lazy(
              () => import("@features/account/components/AccountLayout"),
              "AccountLayout",
            ),
            children: [
              {
                index: true,
                lazy: lazy(
                  () =>
                    import("@features/account/components/AccountOverviewPage"),
                  "AccountOverviewPage",
                ),
              },
              {
                path: "wallet",
                lazy: lazy(
                  () => import("@features/wallet/components/BidHistoryPage"),
                  "BidHistoryPage",
                ),
              },
              {
                path: "purchases",
                lazy: lazy(
                  () =>
                    import("@features/purchases/components/PurchasesListPage"),
                  "PurchasesListPage",
                ),
              },
              {
                path: "purchases/:id",
                lazy: lazy(
                  () =>
                    import("@features/purchases/components/PurchaseDetailPage"),
                  "PurchaseDetailPage",
                ),
              },
              {
                path: "wins",
                lazy: lazy(
                  () => import("@features/wins/components/WinsListPage"),
                  "WinsListPage",
                ),
              },
              {
                path: "wins/:auction_id",
                lazy: lazy(
                  () => import("@features/wins/components/WinDetailPage"),
                  "WinDetailPage",
                ),
              },
              {
                path: "activity",
                lazy: lazy(
                  () => import("@features/activity/components/ActivityPage"),
                  "ActivityPage",
                ),
              },
              {
                path: "profile",
                lazy: lazy(
                  () =>
                    import("@features/account/components/AccountProfilePage"),
                  "AccountProfilePage",
                ),
              },
              {
                path: "security",
                lazy: lazy(
                  () =>
                    import("@features/account/components/AccountSecurityPage"),
                  "AccountSecurityPage",
                ),
              },
              {
                path: "sessions",
                lazy: lazy(
                  () =>
                    import("@features/account/components/AccountSessionsPage"),
                  "AccountSessionsPage",
                ),
              },
              {
                path: "notifications",
                lazy: lazy(
                  () =>
                    import("@features/account/components/AccountNotificationsPage"),
                  "AccountNotificationsPage",
                ),
              },
              {
                path: "data",
                lazy: lazy(
                  () => import("@features/account/components/AccountDataPage"),
                  "AccountDataPage",
                ),
              },
            ],
          },
        ],
      },
      {
        path: "/privacy-policy",
        lazy: lazy(() => import("./components/PrivacyPolicy"), "PrivacyPolicy"),
      },
      {
        path: "/terms-and-conditions",
        lazy: lazy(
          () => import("./components/TermsAndConditions"),
          "TermsAndConditions",
        ),
      },
      {
        path: "/maintenance",
        lazy: lazy(
          () => import("./components/MaintenanceMode"),
          "MaintenanceMode",
        ),
      },
      {
        path: "/admin",
        lazy: lazy(
          () => import("@features/admin/components/AdminRoute"),
          "AdminRoute",
        ),
        children: [
          {
            lazy: lazy(
              () => import("@features/admin/components/Admin/AdminLayout"),
              "AdminLayout",
            ),
            children: [
              {
                index: true,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/AdminDashboard"),
                  "AdminDashboard",
                ),
              },
              {
                path: ADMIN_PATHS.auctions,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Auctions/AdminAuctionsList"),
                  "AdminAuctionsList",
                ),
              },
              {
                path: `${ADMIN_PATHS.auctions}/:id`,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Auctions/AdminAuctionDetail"),
                  "AdminAuctionDetail",
                ),
              },
              {
                path: `${ADMIN_PATHS.auctions}/new`,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Auctions/AdminAuctionCreate"),
                  "AdminAuctionCreate",
                ),
              },
              {
                path: `${ADMIN_PATHS.auctions}/:id/edit`,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Auctions/AdminAuctionEdit"),
                  "AdminAuctionEdit",
                ),
              },
              {
                path: ADMIN_PATHS.bidPacks,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/BidPacks/AdminBidPacksList"),
                  "AdminBidPacksList",
                ),
              },
              {
                path: `${ADMIN_PATHS.bidPacks}/new`,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/BidPacks/AdminBidPackCreate"),
                  "AdminBidPackCreate",
                ),
              },
              {
                path: `${ADMIN_PATHS.bidPacks}/:id/edit`,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/BidPacks/AdminBidPackEdit"),
                  "AdminBidPackEdit",
                ),
              },
              {
                path: ADMIN_PATHS.users,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Users/AdminUsersPage"),
                  "AdminUsersPage",
                ),
              },
              {
                path: ADMIN_PATHS.payments,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Users/AdminPaymentsPage"),
                  "AdminPaymentsPage",
                ),
              },
              {
                path: `${ADMIN_PATHS.payments}/:id`,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Users/AdminPaymentDetailPage"),
                  "AdminPaymentDetailPage",
                ),
              },
              {
                path: ADMIN_PATHS.settings,
                lazy: lazy(
                  () =>
                    import("@features/admin/components/Admin/Settings/AdminSettings"),
                  "AdminSettings",
                ),
              },
            ],
          },
        ],
      },
    ],
  },
];
