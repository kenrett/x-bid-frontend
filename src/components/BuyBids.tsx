import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

const bidPacks = [
  {
    name: "The Flirt",
    bids: 69,
    price: 42.0,
    pricePerBid: "~$0.61",
    highlight: false,
    description: "A perfect start to get a feel for the action.",
  },
  {
    name: "The Rendezvous",
    bids: 150,
    price: 82.0,
    pricePerBid: "~$0.55",
    highlight: false,
    description: "For the bidder who's ready to commit to the chase.",
  },
  {
    name: "The All-Nighter",
    bids: 300,
    price: 150.0,
    pricePerBid: "$0.50",
    highlight: true,
    description: "Our most popular pack. Dominate the auctions.",
  },
  {
    name: "The Affair",
    bids: 600,
    price: 270.0,
    pricePerBid: "$0.45",
    highlight: false,
    description: "The ultimate arsenal for the serious player. Best value.",
  },
];

export const BuyBids = () => {
  const { user } = useAuth();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {bidPacks.map((pack) => (
          <div
            key={pack.name}
            className={`border rounded-lg p-6 flex flex-col text-center shadow-lg transition-transform duration-300 hover:scale-105 ${
              pack.highlight
                ? "border-blue-500 border-2 relative"
                : "border-gray-200"
            }`}
          >
            {pack.highlight && (
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800">{pack.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{pack.description}</p>
            <div className="my-4">
              <span className="text-5xl font-extrabold text-gray-900">
                {pack.bids}
              </span>
              <span className="text-xl font-medium text-gray-600"> Bids</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ${pack.price.toFixed(2)}
            </div>
            <p className="text-gray-500 mb-6">({pack.pricePerBid}/Bid)</p>
            <button
              onClick={() => handleBuy(pack.name)}
              className={`mt-auto w-full font-bold py-3 px-6 rounded-lg transition-colors ${
                pack.highlight
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
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
