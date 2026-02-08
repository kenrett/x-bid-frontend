import { Link } from "react-router-dom";

const CARD_CLASSES =
  "rounded-[var(--sf-radius)] border border-[color:var(--sf-border)] bg-[color:var(--sf-surface)] p-4 flex flex-col gap-2 hover:brightness-95 transition shadow-[var(--sf-shadow)]";

export const AccountOverviewPage = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm text-[color:var(--sf-mutedText)]">
        A quick snapshot of your account, credits, and purchases.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Link to="/account/activity" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-accent)]">
          My Activity
        </p>
        <h3 className="text-xl font-semibold text-[color:var(--sf-text)]">
          Feed
        </h3>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Recent bids, watches, and auction outcomes.
        </p>
      </Link>

      <Link to="/account/wallet" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-accent)]">
          Bid History
        </p>
        <h3 className="text-xl font-semibold text-[color:var(--sf-text)]">
          Credits & activity
        </h3>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Check your balance and transaction history.
        </p>
      </Link>

      <Link to="/account/purchases" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-accent)]">
          Purchases
        </p>
        <h3 className="text-xl font-semibold text-[color:var(--sf-text)]">
          Bid pack receipts
        </h3>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Review purchases and receipts for your bid packs.
        </p>
      </Link>

      <Link to="/account/wins" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-accent)]">
          Won Auctions
        </p>
        <h3 className="text-xl font-semibold text-[color:var(--sf-text)]">
          Your prizes
        </h3>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Track winning bids and fulfillment status.
        </p>
      </Link>

      <Link to="/account/profile" className={CARD_CLASSES}>
        <p className="text-xs uppercase tracking-wide text-[color:var(--sf-accent)]">
          Profile
        </p>
        <h3 className="text-xl font-semibold text-[color:var(--sf-text)]">
          Account details
        </h3>
        <p className="text-sm text-[color:var(--sf-mutedText)]">
          Manage your info and preferences.
        </p>
      </Link>
    </div>
  </div>
);
