import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import type { BidPack } from "../types/bidPack";
import client from "../api/client";

export const BuyBids = () => {
  const { user } = useAuth();
  const [bidPacks, setBidPacks] = useState<BidPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBidPacks = async () => {
      try {
        const response = await client.get<BidPack[]>("/bid_packs");
        setBidPacks(response.data);
      } catch (err) {
        setError("Failed to fetch bid packs.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBidPacks();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="mb-4">You need to be logged in to purchase bids.</p>
        <Link
          to="/login"
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="font-sans bg-[#0d0d1a] text-gray-400 text-lg text-center p-8 min-h-screen">Loading bid packs...</div>;
  }

  if (error) {
    return <div className="font-sans bg-[#0d0d1a] text-red-400 text-lg text-center p-8 min-h-screen">{error}</div>;
  }

  const handleBuy = (packName: string) => {
    // Placeholder for purchase logic
    console.log(`Attempting to buy ${packName}`);
    alert(`Purchase functionality for "${packName}" is not yet implemented.`);
  };

  return (
    <div className="font-sans bg-[#0d0d1a] text-[#e0e0e0] antialiased min-h-screen py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#ff69b4] to-[#a020f0] bg-clip-text text-transparent">
            Arm Yourself
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            More bids mean more power. Choose your pack and dominate the floor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {bidPacks.map((pack, index) => (
            <div
              key={pack.id}
              className={`group flex flex-col text-center bg-[#1a0d2e]/50 backdrop-blur-sm border rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                pack.highlight
                  ? "border-pink-500 hover:shadow-pink-500/20 relative"
                  : "border-white/10 hover:shadow-purple-500/20"
              }`}
              style={{ animation: `fadeInUp 0.5s ${index * 0.1}s ease-out both` }}
            >
              {pack.highlight && (
                <div className="absolute -top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-6">
                  BEST VALUE
                </div>
              )}
              <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
                {pack.name}
              </h2>
              <p className="text-sm text-gray-400 mb-4 h-10">{pack.description}</p>
              <div className="my-4">
                <span className="text-6xl font-extrabold text-white">{pack.bids}</span>
                <span className="text-xl font-medium text-gray-400"> Bids</span>
              </div>
              <div className="text-4xl font-bold text-white mb-2">${Number(pack.price).toFixed(2)}</div>
              <p className="text-pink-400 mb-6 font-medium">({pack.pricePerBid}/Bid)</p>
              <button
                onClick={() => handleBuy(pack.name)}
                className={`mt-auto w-full font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                  pack.highlight
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white transform hover:scale-105"
                    : "bg-white/10 text-white hover:bg-white/20 transform hover:-translate-y-0.5"
                }`}
              >
                Acquire Pack
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
