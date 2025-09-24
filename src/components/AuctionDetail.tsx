import type { AuctionData } from "../types/auction";
import { useAuth } from "../hooks/useAuth";

interface AuctionDetailProps {
  auction: AuctionData;
  onBack: () => void;
}

export function AuctionDetail({ auction, onBack }: AuctionDetailProps) {
  const { user } = useAuth();

  return (
    <div className="font-sans bg-[#0d0d1a] text-[#e0e0e0] antialiased min-h-screen py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-pink-400 transition-colors duration-300 group"
          >
            <svg
              className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Auctions
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#a020f0]/10">
            <img src={auction.image_url} alt={auction.title} className="w-full h-auto object-cover" />
          </div>
          <div className="flex flex-col space-y-6">
            <h1 className="font-serif text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[#ff69b4] to-[#a020f0] bg-clip-text text-transparent">
              {auction.title}
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">{auction.description}</p>
            <p className="text-3xl font-bold text-pink-400">Current Price: ${auction.current_price.toFixed(2)}</p>
            {user && !user.is_admin && (
              <button className="mt-4 w-full text-lg bg-[#ff69b4] text-[#1a0d2e] px-10 py-4 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20">
                Place Your Bid
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}