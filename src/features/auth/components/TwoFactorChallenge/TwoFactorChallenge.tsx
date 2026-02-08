import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export const TwoFactorChallenge = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-6 text-center text-[color:var(--sf-mutedText)]">
      <p className="text-lg font-semibold text-[color:var(--sf-text)]">
        Two-factor moved
      </p>
      <p className="mt-2 text-sm text-[color:var(--sf-mutedText)]">
        Two-factor sign-in is now handled directly on the login form.
      </p>
      <Link
        to="/login"
        className="mt-4 inline-flex rounded-lg border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--sf-text)] hover:bg-white/10"
      >
        Back to login
      </Link>
    </div>
  );
};
