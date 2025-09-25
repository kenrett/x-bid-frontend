import type { AuctionData } from "../types/auction";
import type { Bid } from "../types/bid";
import { useAuth } from "../hooks/useAuth";
import { useState, useCallback, useEffect } from "react";
import { useAuctionChannel } from "@/hooks/useAuctionChannel";
import { BidHistory } from "./BidHistory";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useParams, useNavigate } from "react-router-dom";
import { getAuction } from "@/api/auctions";

export function AuctionDetail() {
  const { id } = useParams();

  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuction = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getAuction(Number(id));
        setAuction(data);
      } catch (err) {
        setError("Failed to fetch auction details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  const handleAuctionData = useCallback((data: { current_price?: number; highest_bidder_id?: number; bid?: Bid }) => {
    setAuction(prevAuction => {
      if (!prevAuction) return null;
      
      const newPrice = data.current_price ?? prevAuction.current_price;
      const newHighestBidder = data.highest_bidder_id ?? prevAuction.highest_bidder_id;
      
      let newBids: Bid[] | number = prevAuction.bids;
      if (data.bid) {
        const currentBids = Array.isArray(prevAuction.bids) ? prevAuction.bids : [];
        newBids = [data.bid, ...currentBids];
      }

      return {
        ...prevAuction,
        current_price: newPrice,
        highest_bidder_id: newHighestBidder,
        bids: newBids,
      };
    });
  }, []);

  useAuctionChannel(auction?.id, handleAuctionData);

  if (loading || !auction) {
    return (
      <div className="font-sans bg-[#0d0d1a] text-gray-400 text-lg text-center p-8 min-h-screen">
        Loading auction...
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans bg-[#0d0d1a] text-red-400 text-lg text-center p-8 min-h-screen">
        {error}
      </div>
    );
  }

  return <AuctionView auction={auction} />;
}

function AuctionView({ auction }: { auction: AuctionData }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bids = Array.isArray(auction.bids) ? auction.bids : [];

  return (
    <div className="font-sans bg-[#0d0d1a] text-[#e0e0e0] antialiased min-h-screen py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/auctions")}
            className="flex items-center text-gray-400 hover:text-pink-400 transition-colors duration-300 group"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Auctions
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#a020f0]/10">
            <img
              src={auction.image_url}
              alt={auction.title}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="flex flex-col space-y-6">
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[#ff69b4] to-[#a020f0] bg-clip-text text-transparent">
              {auction.title}
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">{auction.description}</p>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
              <div className="text-3xl font-bold text-pink-400">
                Current Price: ${auction.current_price.toFixed(2)}
              </div>
              <div className="text-gray-300">
                Highest Bidder:{" "}
                {auction.highest_bidder_id ? (
                  <span className="font-semibold text-purple-400">
                    User {auction.highest_bidder_id}
                  </span>
                ) : (
                  "None"
                )}
              </div>
            </div>
            {auction.status === "active" && user && !user.is_admin && (
              <>
                <BidHistory bids={bids} />
                <button className="mt-4 w-full text-lg bg-[#ff69b4] text-[#1a0d2e] px-10 py-4 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20">
                  Place Your Bid
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}