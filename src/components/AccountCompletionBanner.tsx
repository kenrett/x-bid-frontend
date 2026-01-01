import { Link } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useAccountStatus } from "@features/account/hooks/useAccountStatus";
import { Skeleton } from "./Skeleton";

export const AccountCompletionBanner = () => {
  const { user, isReady } = useAuth();
  const { isLoading, emailVerified } = useAccountStatus();

  if (!isReady || !user) return null;

  if (isLoading) {
    return (
      <div className="border-b border-white/10 bg-white/5">
        <div className="mx-auto max-w-screen-xl px-4 py-2">
          <Skeleton className="h-5 w-80" aria-label="Loading account status" />
        </div>
      </div>
    );
  }

  if (emailVerified !== false) return null;

  return (
    <div className="border-b border-amber-300/30 bg-amber-500/10">
      <div className="mx-auto max-w-screen-xl px-4 py-2 text-sm text-amber-100 flex items-center justify-between gap-3">
        <div>
          <span className="font-semibold">Account completion:</span> Verify your
          email to unlock withdrawals/checkout.
        </div>
        <Link
          to="/account/security"
          className="shrink-0 rounded-lg border border-amber-300/30 bg-black/20 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-black/30 transition-colors"
        >
          Verify now
        </Link>
      </div>
    </div>
  );
};
