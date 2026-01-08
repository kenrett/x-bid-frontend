import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, type CSSProperties } from "react";
import { Header } from "./Header/Header";
import { Footer } from "./Footer/Footer";
import { AccountStatusProvider } from "@features/account/providers/AccountStatusProvider";
import { AccountCompletionBanner } from "./AccountCompletionBanner";
import { showToast } from "@services/toast";
import { useStorefront } from "../storefront/useStorefront";

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectingRef = useRef(false);
  const { config } = useStorefront();
  const { themeTokens } = config;

  useEffect(() => {
    const onEmailUnverified = () => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      showToast("Verify your email to continue.", "error");
      if (!location.pathname.startsWith("/account/verify-email")) {
        const next = encodeURIComponent(location.pathname + location.search);
        navigate(`/account/verify-email?reason=email_unverified&next=${next}`);
      }
      window.setTimeout(() => {
        redirectingRef.current = false;
      }, 500);
    };
    window.addEventListener("app:email_unverified", onEmailUnverified);
    return () =>
      window.removeEventListener("app:email_unverified", onEmailUnverified);
  }, [navigate, location.pathname, location.search]);

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--sf-background)] text-[var(--sf-text)]"
      style={
        {
          ["--sf-primary"]: themeTokens.primary,
          ["--sf-background"]: themeTokens.background,
          ["--sf-text"]: themeTokens.text,
          ["--sf-radius"]: themeTokens.radius,
        } as CSSProperties
      }
    >
      <AccountStatusProvider>
        <Header />
        <AccountCompletionBanner />
        <main className="flex-1">
          <Outlet />
        </main>
      </AccountStatusProvider>
      <Footer />
    </div>
  );
};
