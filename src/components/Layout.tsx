import { Outlet } from "react-router-dom";
import { Header } from "./Header/Header";
import { Footer } from "./Footer/Footer";
import { AccountStatusProvider } from "@features/account/providers/AccountStatusProvider";
import { AccountCompletionBanner } from "./AccountCompletionBanner";

export const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d1a]">
      <AccountStatusProvider>
        <Header />
        <AccountCompletionBanner />
      </AccountStatusProvider>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
