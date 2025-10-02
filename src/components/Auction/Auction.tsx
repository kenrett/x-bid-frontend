interface AuctionProps {
  id: number;
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  onClick: (id: number) => void;
  index: number;
}

export function Auction({
  id,
  title,
  description,
  current_price,
  image_url,
  onClick,
  index,
}: AuctionProps) {
  return (
    <div
      onClick={() => onClick(id)}
      className="group cursor-pointer bg-[#1a0d2e]/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#a020f0]/20"
      style={{
        animation: `fadeInUp 0.5s ${(index * 0.1).toFixed(1)}s ease-out both`,
      }}
    >
      <img src={image_url} alt={title} className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="p-5">
        <h2 className="text-2xl font-serif font-bold mb-2 text-white truncate">{title}</h2>
        <p className="text-gray-400 mb-4 h-12 overflow-hidden text-ellipsis">{description}</p>
        <p className="text-lg font-semibold text-pink-400">Current Price: ${current_price.toFixed(2)}</p>
      </div>
    </div>
  );
}
