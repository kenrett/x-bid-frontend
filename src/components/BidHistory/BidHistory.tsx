import type { Bid } from "../../types/bid";

interface BidItemProps {
  bid: Bid;
}

const BidItem = ({ bid }: BidItemProps) => (
  <li className="py-2 px-3 bg-white/5 rounded-lg flex justify-between items-center text-sm">
    <span>
      <span className="font-semibold text-pink-400">{bid.username}</span> bid{" "}
      <span className="font-bold text-white">
        ${Number(bid.amount).toFixed(2)}
      </span>
    </span>
    <span className="text-gray-500 text-xs">
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
    return <div className="text-center text-gray-500 py-4">No bids yet.</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-white">Bid History</h2>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {sortedBids.map((bid) => (
          <BidItem key={bid.id} bid={bid} />
        ))}
      </ul>
    </div>
  );
};
