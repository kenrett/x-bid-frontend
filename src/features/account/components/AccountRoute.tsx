import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Page } from "@components/Page";
import { useAuth } from "@features/auth/hooks/useAuth";

export const AccountRoute = () => {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <Page centered>
        <p className="text-gray-400 text-lg">Loading your account...</p>
      </Page>
    );
  }

  if (!user) {
    const redirectParam = encodeURIComponent(
      location.pathname + location.search,
    );
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  return <Outlet />;
};
