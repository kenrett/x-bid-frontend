interface AuctionProps {
  id: number;
  title: string;
  description: string;
  current_price: number;
  image_url: string;
  onClick: (id: number) => void;
  index: number;
}

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%231a0d2e'/%3E%3Cpath d='M0 290 L140 210 L250 280 L370 170 L520 280 L640 210 V360 H0 Z' fill='%232a1a44'/%3E%3C/svg%3E";

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

  const loading = index < 2 ? "eager" : "lazy";
  const fetchPriority = index < 2 ? "high" : "low";

  return (
    <button
      data-testid={`auction-card-${id}`}
      type="button"
      onClick={() => onClick(id)}
      className={`group block w-full text-left bg-[#1a0d2e]/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#a020f0]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a020f0] focus:ring-offset-[#0b0716] animate-[fadeInUp_0.5s_ease-out_both] ${delayClass}`}
    >
      <img
        src={image_url || FALLBACK_IMAGE}
        alt={title}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        width={640}
        height={360}
        onError={(event) => {
          event.currentTarget.src = FALLBACK_IMAGE;
        }}
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
