import type { Bid } from "../../types/bid";

interface BidItemProps {
  bid: Bid;
}

const BidItem = ({ bid }: BidItemProps) => (
  <li className="py-2 px-3 bg-[color:var(--sf-surface)] rounded-[var(--sf-radius)] border border-[color:var(--sf-border)] flex justify-between items-center text-sm shadow-[var(--sf-shadow)]">
    <span>
      <span className="font-semibold text-[color:var(--sf-mutedText)]">
        {bid.username}
      </span>{" "}
      bid{" "}
      <span className="font-bold text-[color:var(--sf-primary)]">
        ${Number(bid.amount).toFixed(2)}
      </span>
    </span>
    <span className="text-[color:var(--sf-mutedText)] text-xs">
      {new Date(bid.created_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })}
    </span>
  </li>
);

interface BidHistoryProps {
  bids: Bid[];
}

export const BidHistory = ({ bids }: BidHistoryProps) => {
  const sortedBids = [...bids].sort((a, b) => {
    const dateDiff =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return dateDiff !== 0 ? dateDiff : b.id - a.id;
  });

  if (sortedBids.length === 0) {
    return (
      <div className="text-center text-[color:var(--sf-mutedText)] py-4">
        No bids yet.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-[color:var(--sf-text)]">
        Bid History
      </h2>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {sortedBids.map((bid) => (
          <BidItem key={bid.id} bid={bid} />
        ))}
      </ul>
    </div>
  );
};
