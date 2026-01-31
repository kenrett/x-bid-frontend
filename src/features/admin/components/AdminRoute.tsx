import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@services/toast";
import { AdminAccessDenied } from "./AdminAccessDenied";

export const AdminRoute = () => {
  const { user: authUser, isReady } = useAuth();
  const location = useLocation();
  const hasNotifiedRef = useRef(false);
  const isAdmin = Boolean(authUser?.is_admin || authUser?.is_superuser);

  useEffect(() => {
    if (!isReady) return;
    if (isAdmin) return;
    if (hasNotifiedRef.current) return;

    hasNotifiedRef.current = true;
    showToast(
      "Admin access only. Please sign in with an admin account.",
      "error",
    );
  }, [isAdmin, isReady]);

  if (!isReady) {
    return null;
  }

  if (!isAdmin) {
    if (authUser) {
      return <AdminAccessDenied />;
    }
    const redirectParam = encodeURIComponent(
      location.pathname + location.search,
    );
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  return <Outlet />;
};
