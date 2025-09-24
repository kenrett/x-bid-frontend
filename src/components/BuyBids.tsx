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
    return <div className="text-center p-8">Loading bid packs...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  const handleBuy = (packName: string) => {
    // Placeholder for purchase logic
    console.log(`Attempting to buy ${packName}`);
    alert(`Purchase functionality for "${packName}" is not yet implemented.`);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Stock Up on Bids
        </h1>
        <p className="text-lg text-gray-600">
          More bids mean more chances to win. Choose your pack.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
        {bidPacks.map((pack, index) => (
          <div
            key={pack.id}
            className={`group bg-white rounded-xl p-6 flex flex-col text-center shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
              pack.highlight
                ? "bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-500 relative"
                : "border border-gray-200"
            }`}
            style={{ animation: `fadeInUp 0.5s ${index * 0.1}s ease-out both` }}
          >
            {pack.highlight && (
              <div className="absolute -top-4 right-4 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-6">
                MOST POPULAR
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {pack.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4 h-10">
              {pack.description}
            </p>
            <div className="my-4">
              <span className="text-5xl font-extrabold text-gray-900">
                {pack.bids}
              </span>
              <span className="text-xl font-medium text-gray-600"> Bids</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ${Number(pack.price).toFixed(2)}
            </div>
            <p className="text-gray-500 mb-6 font-medium">
              ({pack.pricePerBid}/Bid)
            </p>
            <button
              onClick={() => handleBuy(pack.name)}
              className={`mt-auto w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                pack.highlight
                  ? "bg-blue-600 text-white hover:bg-blue-700 transform hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 transform hover:-translate-y-0.5"
              }`}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
