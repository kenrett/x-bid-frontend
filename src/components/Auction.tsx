interface AuctionProps {
  id: number;
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  onClick: (id: number) => void;
}

export function Auction({ id, title, description, current_price, image_url, onClick }: AuctionProps) {
  return (
    <div onClick={() => onClick(id)} className="cursor-pointer block border border-gray-300 rounded-lg p-4 shadow-md w-full md:w-1/3 lg:w-1/4 transition-transform duration-200 hover:scale-105 hover:shadow-xl">
      <div>
        <img src={image_url} alt={title} className="w-full h-48 object-cover mb-4 rounded-md" />
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-gray-700 mb-4">{description}</p>
        <p className="text-lg font-semibold text-green-600">
          Starting at: ${current_price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
