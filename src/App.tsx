import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import AuctionList from "./components/AuctionDetail/AuctionList";
import { AuctionDetail } from "./components/AuctionDetail";
import { LoginForm } from "./components/LoginForm";
import { SignUpForm } from "./components/SignUpForm";
import { About } from "./components/About";
import { HowItWorks } from "./components/HowItWorks";
import { BuyBids } from "./components/BuyBids";

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
    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;