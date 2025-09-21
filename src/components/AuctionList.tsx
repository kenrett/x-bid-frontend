import { useState, useEffect } from "react";
import { getAuction, getAuctions } from "../api/auctions";
import type { AuctionData } from "../types/auction";
import { Auction } from "./Auction";
import { AuctionDetail } from "./AuctionDetail";

const AuctionList = () => {
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const data = await getAuctions();
        setAuctions(data);
      } catch (err) {
        setError("Failed to fetch auctions.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  const handleBack = () => {
    setSelectedAuction(null);
  };

  if (loading) {
    return <div>Loading auctions...</div>;
  }

  if (selectedAuction) {
    return <AuctionDetail auction={selectedAuction} onBack={handleBack} />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleAuctionClick = async (id: number) => {
    setLoading(true);
    try {
      const data = await getAuction(id);
      setSelectedAuction(data);
    } catch (error) {
      console.error('Error fetching auction details:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      {auctions.length === 0 ? (
        <p>No auctions found.</p>
      ) : (
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6 text-center">Current Auctions</h1>
          <div className="flex flex-wrap gap-4 justify-center">
            {auctions.map((auction) => (
              <Auction key={auction.id} {...auction} onClick={handleAuctionClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionList;
