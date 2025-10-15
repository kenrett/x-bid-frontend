import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import type { BidPack } from "../../types/bidPack";
import client from "../../api/client";
export const BuyBids = () => {
  const { user } = useAuth();
  const [bidPacks, setBidPacks] = useState<BidPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
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
      <div className="font-sans bg-[#0d0d1a] text-[#e0e0e0] antialiased min-h-screen py-12 md:py-20 px-4 text-center">
        <h2 className="font-serif text-4xl font-bold mb-4 text-white">Your Arsenal Awaits</h2>
        <p className="mb-6 text-lg text-gray-400">Log in to arm yourself for the auction floor.</p>
        <Link
          to="/login"
          className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
        >
          Log In to Continue
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

  const handleBuy = async (id: number) => {
    if (!user) {
      setError("You must be logged in to purchase a pack.");
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await client.post(`bid_packs/${id}/purchase`, {
        user_id: user.id,
      });

      // updateUserBalance(res.data.new_balance);
      setSuccess(true);
      // TODO: Implement toast notification for success
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Something went wrong during purchase.";
      setError(message);
      // toast.error(message);
    } finally {
      setLoading(false);
    }
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
                onClick={() => handleBuy(pack.id)}
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
