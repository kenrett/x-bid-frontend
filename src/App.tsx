import { createBrowserRouter, RouterProvider } from "react-router-dom";
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

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <AuctionList /> },
      { path: "/auctions", element: <AuctionList /> },
      { path: "/auctions/:id", element: <AuctionDetail /> },
      { path: "/login", element: <LoginForm /> },
      { path: "/signup", element: <SignUpForm /> },
      { path: "/about", element: <About /> },
      { path: "/how-it-works", element: <HowItWorks /> },
      { path: "/buy-bids", element: <BuyBids /> },
      { path: "/purchase-status", element: <PurchaseStatus /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/terms_and_conditions", element: <TermsAndConditions /> },
    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;