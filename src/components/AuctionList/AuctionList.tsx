import { useState, useEffect, useCallback } from "react";
import { getAuctions } from "@api/auctions";
import type { AuctionSummary } from "../../types/auction";
import { Auction } from "../Auction/Auction";
import { useNavigate } from "react-router-dom";
import { Page } from "../Page";
import {
  UNEXPECTED_RESPONSE_MESSAGE,
  UnexpectedResponseError,
} from "@/services/unexpectedResponse";
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

  if (loading) {
    return <div role="status">Loading auctions...</div>;
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
