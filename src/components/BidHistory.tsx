import { useAuctionChannel } from "@/hooks/useAuctionChannel";
import { useState, useCallback, useEffect } from "react";
import type { Bid } from "../types/bid";
import { getBidHistory } from "@/api/bids";

 interface BidItemProps {
   bid: Bid;
 }
 
 const BidItem = ({ bid }: BidItemProps) => (
   <li className="py-2 px-3 bg-white/5 rounded-lg flex justify-between items-center text-sm">
     <span>
       <span className="font-semibold text-pink-400">{bid.username}</span> bid{" "}
       <span className="font-bold text-white">${Number(bid.amount).toFixed(2)}</span>
     </span>
     <span className="text-gray-500 text-xs">
       {new Date(bid.created_at).toLocaleTimeString()}
     </span>
   </li>
 );

// This component fetches its own bid history and also listens for real-time updates.
// It informs its parent of the latest bid via the `onLatestBid` callback.
 
 interface BidHistoryProps {
   auctionId: number;
   onLatestBid: (bid: Bid | null) => void;
 }
 
 export const BidHistory = ({ auctionId, onLatestBid }: BidHistoryProps) => {
   const [bids, setBids] = useState<Bid[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const handleNewBid = useCallback((data: { bid?: Bid }) => {
     const newBid = data.bid;
     if (newBid) {
       // Prepend the new bid and notify the parent component.
       setBids(prevBids => [newBid, ...prevBids]);
       onLatestBid(newBid);
     }
   }, [onLatestBid]);
 
   useAuctionChannel(auctionId, handleNewBid);
 
   useEffect(() => {
     const fetchBids = async () => {
       try {
         setLoading(true);
         const fetchedBids = await getBidHistory(auctionId);
         setBids(fetchedBids);
         // On initial load, inform the parent of the most recent bid.
         onLatestBid(fetchedBids.length > 0 ? fetchedBids[0] : null);
       } catch (err) {
         setError("Failed to fetch bid history.");
         console.error(err);
       } finally {
         setLoading(false);
       }
     };
 
     fetchBids();
   }, [auctionId, onLatestBid]);
 
   if (loading) return <div className="text-center text-gray-500 py-4">Loading bid history...</div>;
   if (error) return <div className="text-center text-red-400 py-4">{error}</div>;
   if (bids.length === 0) {
     return (
       <div className="text-center text-gray-500 py-4">No bids yet.</div>
     );
   }
 
   return (
     <div>
       <h2 className="text-2xl font-bold mb-4 text-white">Bid History</h2>
       <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
         {bids.map((bid) => (
           <BidItem key={bid.id} bid={bid} />
         ))}
       </ul>
     </div>
   );
 };
