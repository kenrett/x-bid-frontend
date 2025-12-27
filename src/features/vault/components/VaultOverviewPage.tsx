import { Link } from "react-router-dom";

const CARD_CLASSES =
  "rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors shadow-lg shadow-black/5";

export const VaultOverviewPage = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm text-gray-400">
        A quick snapshot of your account, credits, and purchases.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Link to="/account/activity" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-pink-300">
          My Activity
        </p>
        <h3 className="text-xl font-semibold text-white">Feed</h3>
        <p className="text-sm text-gray-400">
          Recent bids, watches, and auction outcomes.
        </p>
      </Link>

      <Link to="/account/wallet" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-pink-300">
          Bid History
        </p>
        <h3 className="text-xl font-semibold text-white">Credits & activity</h3>
        <p className="text-sm text-gray-400">
          Check your balance and transaction history.
        </p>
      </Link>

      <Link to="/account/purchases" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-pink-300">
          Purchases
        </p>
        <h3 className="text-xl font-semibold text-white">Bid pack receipts</h3>
        <p className="text-sm text-gray-400">
          Review purchases and receipts for your bid packs.
        </p>
      </Link>

      <Link to="/account/profile" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-pink-300">Profile</p>
        <h3 className="text-xl font-semibold text-white">Account details</h3>
        <p className="text-sm text-gray-400">
          Manage your info and preferences.
        </p>
      </Link>
    </div>
  </div>
);
