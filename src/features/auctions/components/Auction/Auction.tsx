interface AuctionProps {
  id: number;
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  onClick: (id: number) => void;
  index: number;
}

const STAGGER_DELAY_CLASSES = [
  "[animation-delay:0s]",
  "[animation-delay:0.1s]",
  "[animation-delay:0.2s]",
  "[animation-delay:0.3s]",
  "[animation-delay:0.4s]",
  "[animation-delay:0.5s]",
  "[animation-delay:0.6s]",
  "[animation-delay:0.7s]",
  "[animation-delay:0.8s]",
  "[animation-delay:0.9s]",
  "[animation-delay:1s]",
  "[animation-delay:1.1s]",
  "[animation-delay:1.2s]",
  "[animation-delay:1.3s]",
  "[animation-delay:1.4s]",
  "[animation-delay:1.5s]",
] as const;

export function Auction({
  id,
  title,
  description,
  current_price,
  image_url,
  onClick,
  index,
}: AuctionProps) {
  const delayClass =
    STAGGER_DELAY_CLASSES[Math.min(index, STAGGER_DELAY_CLASSES.length - 1)] ??
    STAGGER_DELAY_CLASSES[0];

  return (
    <button
      data-testid={`auction-card-${id}`}
      type="button"
      onClick={() => onClick(id)}
      className={`group block w-full text-left bg-[#1a0d2e]/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#a020f0]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a020f0] focus:ring-offset-[#0b0716] animate-[fadeInUp_0.5s_ease-out_both] ${delayClass}`}
    >
      <img
        src={image_url}
        alt={title}
        className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="p-5">
        <h2 className="text-2xl font-serif font-bold mb-2 text-white truncate">
          {title}
        </h2>
        <p className="text-gray-400 mb-4 h-12 overflow-hidden text-ellipsis">
          {description}
        </p>
        <p className="text-lg font-semibold text-pink-400">
          Current Price: ${current_price.toFixed(2)}
        </p>
      </div>
    </button>
  );
}
