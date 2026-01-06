import { Link } from "react-router-dom";

export const GoodbyePage = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-purple-500/10">
        <h1 className="text-3xl font-serif font-bold text-white">
          Account deleted
        </h1>
        <p className="mt-3 text-sm text-gray-300">
          Your account has been permanently deleted and you have been signed
          out.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-[#ff69b4] px-4 py-2 text-sm font-semibold text-[#1a0d2e] hover:bg-[#a020f0] hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};
