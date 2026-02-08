import { Link } from "react-router-dom";

export const AccountDataPage = () => {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[color:var(--sf-text)]">
          Data
        </h2>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Export your data or permanently delete your account.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/account/data/export"
          className="block rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-5 transition hover:bg-white/10"
        >
          <h3 className="text-lg font-semibold text-[color:var(--sf-text)]">
            Export your data
          </h3>
          <p className="mt-1 text-sm text-[color:var(--sf-mutedText)]">
            Request an export and download it as JSON.
          </p>
          <div className="mt-4 text-sm font-semibold text-[color:var(--sf-accent)]">
            Manage export →
          </div>
        </Link>

        <Link
          to="/account/data/delete"
          className="block rounded-2xl border border-red-400/30 bg-red-900/10 p-5 transition hover:bg-red-900/15"
        >
          <h3 className="text-lg font-semibold text-red-50">Delete account</h3>
          <p className="mt-1 text-sm text-red-100/90">
            Permanently delete your account with typed confirmation.
          </p>
          <div className="mt-4 text-sm font-semibold text-red-100">
            Continue →
          </div>
        </Link>
      </div>
    </div>
  );
};
