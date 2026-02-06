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
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-gray-200">
      <p className="text-lg font-semibold text-white">Two-factor moved</p>
      <p className="mt-2 text-sm text-gray-300">
        Two-factor sign-in is now handled directly on the login form.
      </p>
      <Link
        to="/login"
        className="mt-4 inline-flex rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
      >
        Back to login
      </Link>
    </div>
  );
};
