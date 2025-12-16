import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import AuctionList from "./components/AuctionList/AuctionList";
import { AuctionDetail } from "./components/AuctionDetail/AuctionDetail";
import { LoginForm } from "./components/LoginForm/LoginForm";
import { SignUpForm } from "./components/SignUpForm/SignUpForm";
import { About } from "./components/About/About";
import { HowItWorks } from "./components/HowItWorks";
import { BuyBids } from "./components/BuyBids/BuyBids";
import { PurchaseStatus } from "./components/BuyBids/PurchaseStatus";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsAndConditions } from "./components/TermsAndConditions";
import { RouteErrorBoundary } from "./components/ErrorBoundary/RouteErrorBoundary";
import { AdminRoute } from "@features/admin/components/AdminRoute";
import { AdminDashboard } from "@features/admin/components/Admin/AdminDashboard";
import { AdminLayout } from "@features/admin/components/Admin/AdminLayout";
import { ADMIN_PATHS } from "@features/admin/components/Admin/adminPaths";
import { AdminAuctionsList } from "@features/admin/components/Admin/Auctions/AdminAuctionsList";
import { AdminAuctionCreate } from "@features/admin/components/Admin/Auctions/AdminAuctionCreate";
import { AdminAuctionEdit } from "@features/admin/components/Admin/Auctions/AdminAuctionEdit";
import { AdminAuctionDetail } from "@features/admin/components/Admin/Auctions/AdminAuctionDetail";
import { AdminBidPacksList } from "@features/admin/components/Admin/BidPacks/AdminBidPacksList";
import { AdminBidPackCreate } from "@features/admin/components/Admin/BidPacks/AdminBidPackCreate";
import { AdminBidPackEdit } from "@features/admin/components/Admin/BidPacks/AdminBidPackEdit";
import { AdminUsersPage } from "@features/admin/components/Admin/Users/AdminUsersPage";
import { AdminSettings } from "@features/admin/components/Admin/Settings/AdminSettings";
import { AdminPaymentsPage } from "@features/admin/components/Admin/Users/AdminPaymentsPage";
import { ForgotPassword } from "./components/Auth/ForgotPassword";
import { ResetPassword } from "./components/Auth/ResetPassword";
import { MaintenanceMode } from "./components/MaintenanceMode";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <AuctionList /> },
      { path: "/auctions", element: <AuctionList /> },
      { path: "/auctions/:id", element: <AuctionDetail /> },
      { path: "/login", element: <LoginForm /> },
      { path: "/signup", element: <SignUpForm /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/about", element: <About /> },
      { path: "/how-it-works", element: <HowItWorks /> },
      { path: "/buy-bids", element: <BuyBids /> },
      { path: "/purchase-status", element: <PurchaseStatus /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/terms-and-conditions", element: <TermsAndConditions /> },
      { path: "/maintenance", element: <MaintenanceMode /> },
      {
        path: "/admin",
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              {
                path: ADMIN_PATHS.auctions,
                element: <AdminAuctionsList />,
              },
              {
                path: `${ADMIN_PATHS.auctions}/:id`,
                element: <AdminAuctionDetail />,
              },
              {
                path: `${ADMIN_PATHS.auctions}/new`,
                element: <AdminAuctionCreate />,
              },
              {
                path: `${ADMIN_PATHS.auctions}/:id/edit`,
                element: <AdminAuctionEdit />,
              },
              {
                path: ADMIN_PATHS.bidPacks,
                element: <AdminBidPacksList />,
              },
              {
                path: `${ADMIN_PATHS.bidPacks}/new`,
                element: <AdminBidPackCreate />,
              },
              {
                path: `${ADMIN_PATHS.bidPacks}/:id/edit`,
                element: <AdminBidPackEdit />,
              },
              {
                path: ADMIN_PATHS.users,
                element: <AdminUsersPage />,
              },
              {
                path: ADMIN_PATHS.payments,
                element: <AdminPaymentsPage />,
              },
              {
                path: ADMIN_PATHS.settings,
                element: <AdminSettings />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
