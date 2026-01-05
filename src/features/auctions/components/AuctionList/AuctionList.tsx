import { useState, useEffect, useCallback } from "react";
import { getAuctions } from "@features/auctions/api/auctions";
import type { AuctionSummary } from "../../types/auction";
import { Auction } from "../Auction/Auction";
import { useNavigate } from "react-router-dom";
import { Page } from "@components/Page";
import { Skeleton } from "@components/Skeleton";
import {
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@services/unexpectedResponse";
import {
  useAuctionListChannel,
  type AuctionListUpdate,
} from "@features/auctions/hooks/useAuctionListChannel";

const mergeAuctionUpdate = (
  current: AuctionSummary[],
  update: AuctionListUpdate,
): AuctionSummary[] => {
  if (update.status === "cancelled") {
    return current.filter((auction) => auction.id !== update.id);
  }

  const existingIndex = current.findIndex(
    (auction) => auction.id === update.id,
  );

  if (existingIndex === -1) {
    const nextAuction: AuctionSummary = {
      id: update.id,
      title: update.title ?? "Untitled auction",
      description: update.description ?? "",
      current_price: update.current_price ?? 0,
      image_url: update.image_url ?? "",
      status: update.status ?? "active",
      start_date: update.start_date ?? "",
      end_time: update.end_time ?? "",
      highest_bidder_id: update.highest_bidder_id ?? null,
      winning_user_name: update.winning_user_name ?? null,
      bid_count: update.bid_count ?? 0,
    };
    return [...current, nextAuction];
  }

  const next = [...current];
  const existing = current[existingIndex];
  next[existingIndex] = {
    ...existing,
    ...update,
    current_price:
      update.current_price !== undefined
        ? update.current_price
        : existing.current_price,
    highest_bidder_id:
      update.highest_bidder_id !== undefined
        ? update.highest_bidder_id
        : existing.highest_bidder_id,
    bid_count:
      update.bid_count !== undefined ? update.bid_count : existing.bid_count,
    status: update.status ?? existing.status,
  };
  return next;
};

const AuctionList = () => {
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const data = await getAuctions();
        setAuctions(data);
      } catch (err) {
        setError(
          err instanceof UnexpectedResponseError
            ? UNEXPECTED_RESPONSE_MESSAGE
            : "Failed to fetch auctions.",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  const handleAuctionClick = useCallback(
    (id: number) => {
      navigate(`/auctions/${id}`);
    },
    [navigate],
  );

  const handleLiveUpdate = useCallback((update: AuctionListUpdate) => {
    setAuctions((prev) => mergeAuctionUpdate(prev, update));
  }, []);

  const { connectionState } = useAuctionListChannel(handleLiveUpdate);

  if (loading) {
    return (
      <Page>
        <div className="container mx-auto p-4" role="status">
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#ff69b4] to-[#a020f0] bg-clip-text text-transparent">
              Your Next Obsession
            </h1>
            <p className="text-lg md:text-xl text-gray-400">
              The chase is on. Find your prize and make your move.
            </p>
            <div className="flex justify-center mt-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-300">
                <span className="h-2 w-2 rounded-full bg-gray-500" />
                Loading auctions…
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="w-full bg-[#1a0d2e]/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg"
              >
                <Skeleton className="block h-56 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="block h-7 w-3/4" />
                  <Skeleton className="block h-4 w-full" />
                  <Skeleton className="block h-4 w-5/6" />
                  <Skeleton className="block h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="sr-only" aria-live="polite">
            Live updates {connectionState === "connected" ? "on" : "paused"}
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return <div role="alert">{error}</div>;
  }

  return (
    <Page>
      {auctions.length === 0 ? (
        <p className="text-center text-gray-400">No auctions found.</p>
      ) : (
        <div className="container mx-auto p-4">
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#ff69b4] to-[#a020f0] bg-clip-text text-transparent">
              Your Next Obsession
            </h1>
            <p className="text-lg md:text-xl text-gray-400">
              The chase is on. Find your prize and make your move.
            </p>
            <div className="flex justify-center mt-3">
              <span
                data-testid="live-status"
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  connectionState === "connected"
                    ? "bg-green-900 text-green-100"
                    : "bg-gray-800 text-gray-300"
                }`}
                aria-live="polite"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    connectionState === "connected"
                      ? "bg-green-400"
                      : "bg-gray-500"
                  }`}
                />
                Live updates {connectionState === "connected" ? "on" : "paused"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {auctions.map((auction, index) => (
              <Auction
                key={auction.id}
                {...auction}
                onClick={handleAuctionClick}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </Page>
  );
};

export default AuctionList;
