import { useStorefront } from "../../../../storefront/useStorefront";

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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23e7e5e4'/%3E%3Cpath d='M0 290 L140 210 L250 280 L370 170 L520 280 L640 210 V360 H0 Z' fill='%23d6d3d1'/%3E%3C/svg%3E";

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

  const { key: storefrontKey } = useStorefront();
  const isArtisan = storefrontKey === "marketplace";

  return (
    <button
      data-testid={`auction-card-${id}`}
      type="button"
      onClick={() => onClick(id)}
      className={`group block w-full text-left overflow-hidden rounded-[var(--sf-radius)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-primary)] focus:ring-offset-2 focus:ring-offset-[color:var(--sf-background)] animate-[fadeInUp_0.5s_ease-out_both] ${delayClass} ${
        isArtisan
          ? "bg-[color:var(--sf-surface)] border-[color:var(--sf-accent)]/60 border-[1px] shadow-[0_12px_35px_rgba(35,38,29,0.35)] hover:-translate-y-[0.35rem] hover:shadow-[0_18px_45px_rgba(35,38,29,0.35)]"
          : "bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] shadow-[var(--sf-shadow)] hover:-translate-y-1 hover:shadow-[var(--sf-shadow)]"
      }`}
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
        <h2
          className="text-2xl font-bold mb-2 text-[color:var(--sf-text)] truncate"
          style={{ fontFamily: "var(--sf-heading-font)" }}
        >
          {title}
        </h2>
        <p className="text-[color:var(--sf-mutedText)] mb-4 h-12 overflow-hidden text-ellipsis">
          {description}
        </p>
        <p className="text-lg font-semibold text-[color:var(--sf-primary)]">
          Current Price: ${current_price.toFixed(2)}
        </p>
      </div>
    </button>
  );
}
