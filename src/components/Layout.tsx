import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, type CSSProperties } from "react";
import { Header } from "./Header/Header";
import { Footer } from "./Footer/Footer";
import { AccountStatusProvider } from "@features/account/providers/AccountStatusProvider";
import { AccountCompletionBanner } from "./AccountCompletionBanner";
import { showToast } from "@services/toast";
import { useStorefront } from "../storefront/useStorefront";
import { getAppMode } from "../appMode/appMode";
import { useAuth } from "@features/auth/hooks/useAuth";
import { AgeGateModal } from "./AgeGateModal";
import { AuthDebugPanel } from "../debug/AuthDebugPanel";
import { maybeLogStorefrontSwitchLanding } from "../debug/authDebugSwitch";
import { UploadProvider } from "@features/uploads/UploadProvider";
import { defaultUploadAdapter } from "@features/uploads/uploadConfig";

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectingRef = useRef(false);
  const { user, isReady } = useAuth();
  const { config } = useStorefront();
  const { themeTokens } = config;

  useEffect(() => {
    if (getAppMode() !== "account") return;
    if (!isReady) return;

    const pathname = location.pathname;

    if (pathname === "/wallet") {
      navigate("/account/wallet", { replace: true });
      return;
    }

    const allowedExact = new Set<string>([
      "/login",
      "/signup",
      "/maintenance",
      "/goodbye",
    ]);
    const allowedPrefixes = [
      "/account/wallet",
      "/account/profile",
      "/account/verify-email",
    ];
    const allowed =
      allowedExact.has(pathname) ||
      allowedPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );

    if (allowed) return;

    const target = user ? "/account/wallet" : "/login";
    if (pathname !== target) navigate(target, { replace: true });
  }, [isReady, user, location.pathname, navigate]);

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

  useEffect(() => {
    void maybeLogStorefrontSwitchLanding();
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--sf-background)] text-[var(--sf-text)]"
      style={
        {
          ["--sf-primary"]: themeTokens.primary,
          ["--sf-accent"]: themeTokens.accent,
          ["--sf-background"]: themeTokens.background,
          ["--sf-surface"]: themeTokens.surface,
          ["--sf-border"]: themeTokens.border,
          ["--sf-text"]: themeTokens.text,
          ["--sf-mutedText"]: themeTokens.mutedText,
          ["--sf-onPrimary"]: themeTokens.onPrimary,
          ["--sf-radius"]: themeTokens.radius,
          ["--sf-shadow"]: themeTokens.shadow,
          ["--sf-heading-font"]: themeTokens.headingFont,
          ["--sf-body-font"]: themeTokens.bodyFont,
          ["--sf-status-success-bg"]: themeTokens.status.success.bg,
          ["--sf-status-success-text"]: themeTokens.status.success.text,
          ["--sf-status-success-border"]: themeTokens.status.success.border,
          ["--sf-status-warning-bg"]: themeTokens.status.warning.bg,
          ["--sf-status-warning-text"]: themeTokens.status.warning.text,
          ["--sf-status-warning-border"]: themeTokens.status.warning.border,
          ["--sf-status-error-bg"]: themeTokens.status.error.bg,
          ["--sf-status-error-text"]: themeTokens.status.error.text,
          ["--sf-status-error-border"]: themeTokens.status.error.border,
          ["--sf-status-info-bg"]: themeTokens.status.info.bg,
          ["--sf-status-info-text"]: themeTokens.status.info.text,
          ["--sf-status-info-border"]: themeTokens.status.info.border,
          fontFamily: themeTokens.bodyFont,
        } as CSSProperties
      }
    >
      <UploadProvider adapter={defaultUploadAdapter}>
        <AccountStatusProvider>
          <Header />
          <AccountCompletionBanner />
          <main className="flex-1">
            <Outlet />
          </main>
        </AccountStatusProvider>
      </UploadProvider>
      <AgeGateModal />
      <Footer />
      <AuthDebugPanel />
    </div>
  );
};
