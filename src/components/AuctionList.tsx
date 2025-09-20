import { useState, useEffect } from "react";
import { getAuctions } from "../api/auctions";
import type { Auction } from "../types/auction";

const AuctionList = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
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

  if (loading) {
    return <div>Loading auctions...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Auctions</h1>
      {auctions.length === 0 ? (
        <p>No auctions found.</p>
      ) : (
        <ul>
          {auctions.map((auction, index) => (
            <li key={index} className="mb-2 p-2 border rounded">
              <h2 className="text-xl">{auction.title}</h2>
              <p>{auction.description}</p>
              <p>Current Price: ${auction.current_price}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AuctionList;
