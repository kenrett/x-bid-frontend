import type { AuctionData } from "../types/auction";

interface AuctionDetailProps {
  auction: AuctionData;
  onBack: () => void;
}

export function AuctionDetail({ auction, onBack }: AuctionDetailProps) {
  return (
    <div className="container mx-auto p-4">
      <button onClick={onBack} className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
        &larr; Back to Auctions
      </button>
      <div className="border border-gray-300 rounded-lg p-4 shadow-md">
        <img src={auction.image_url} alt={auction.title} className="w-full h-96 object-cover mb-4 rounded-md" />
        <h1 className="text-4xl font-bold mb-2">{auction.title}</h1>
        <p className="text-gray-700 mb-4">{auction.description}</p>
        <p className="text-2xl font-semibold text-green-600">
          Starting at: ${auction.current_price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}