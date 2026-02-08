import { Link } from "react-router-dom";
import { Page } from "@components/Page";

export const AdminAccessDenied = () => {
  return (
    <Page centered>
      <div className="max-w-md rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
          Admin access
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--sf-text)]">
          Insufficient permissions
        </h1>
        <p className="mt-3 text-sm text-[color:var(--sf-mutedText)]">
          Your account does not have access to the admin console. If you believe
          this is an error, contact support.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/auctions"
            className="rounded-lg border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:bg-white/10"
          >
            Back to auctions
          </Link>
          <Link
            to="/account"
            className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black"
          >
            Go to account
          </Link>
        </div>
      </div>
    </Page>
  );
};
