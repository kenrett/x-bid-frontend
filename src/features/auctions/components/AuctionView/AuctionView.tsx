import { memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

import { Countdown } from "../Countdown/Countdown";
const BidHistory = lazy(() =>
  import("../BidHistory/BidHistory").then((module) => ({
    default: module.BidHistory,
  })),
);

import type { AuctionDetail } from "../../types/auction";
import type { Bid } from "../../types/bid";
import type { AuctionConnectionState } from "@features/auctions/hooks/useAuctionChannel";
import type { User as AuthUser } from "@features/auth/types/user";
import { normalizeUploadAssetUrl } from "@utils/uploadAssetUrl";

interface AuctionViewProps {
  auction: AuctionDetail;
  user: AuthUser | null;
  isBidding: boolean;
  bidError: string | null;
  highestBidderUsername: string | null;
  connectionState: AuctionConnectionState;
  onPlaceBid: () => void;
  onTimerEnd: () => void;
  bids: Bid[];
}

const AuctionViewComponent = ({
  auction,
  user,
  isBidding,
  bidError,
  highestBidderUsername,
  connectionState,
  onPlaceBid,
  onTimerEnd,
  bids,
}: AuctionViewProps) => {
  const navigate = useNavigate();
  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const imageSrc =
    normalizeUploadAssetUrl(auction.image_url) || "/assets/BidderSweet.svg";
  const isEmailVerified =
    user?.email_verified !== false || Boolean(user?.email_verified_at);
  const isBiddingBlockedByEmail = Boolean(
    auction.status === "active" &&
    user &&
    !(user.is_admin || user.is_superuser) &&
    !isEmailVerified,
  );

  return (
    <div className="font-sans bg-[color:var(--sf-background)] text-[color:var(--sf-text)] antialiased min-h-screen py-12 md:py-20 px-4">
      <div className="container mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/auctions")}
            className="flex items-center text-[color:var(--sf-mutedText)] hover:text-[color:var(--sf-primary)] transition-colors duration-300 group rounded-[var(--sf-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)]"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Auctions
          </button>
        </div>
        <div className="flex items-center justify-between mb-4 text-sm text-[color:var(--sf-mutedText)]">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide uppercase ${
                isConnected
                  ? "border-[color:var(--sf-status-success-border)] bg-[color:var(--sf-status-success-bg)] text-[color:var(--sf-status-success-text)]"
                  : isConnecting
                    ? "border-[color:var(--sf-status-warning-border)] bg-[color:var(--sf-status-warning-bg)] text-[color:var(--sf-status-warning-text)]"
                    : "border-[color:var(--sf-status-error-border)] bg-[color:var(--sf-status-error-bg)] text-[color:var(--sf-status-error-text)]"
              }`}
              aria-live="polite"
            >
              {isConnected ? (
                <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              ) : isConnecting ? (
                <ExclamationTriangleIcon
                  className="h-3.5 w-3.5 animate-pulse"
                  aria-hidden="true"
                />
              ) : (
                <XCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isConnected
                ? "Live connected"
                : isConnecting
                  ? "Live reconnecting"
                  : "Live offline"}
            </span>
            {!isConnected && (
              <span className="text-xs text-[color:var(--sf-mutedText)]">
                {isConnecting
                  ? "Connecting to live feed..."
                  : "Live feed disconnected. Trying to reconnect."}
              </span>
            )}
          </div>
        </div>
        {!isConnected && (
          <div
            className="mb-4 rounded-xl border border-[color:var(--sf-status-error-border)] bg-[color:var(--sf-status-error-bg)] px-4 py-3 text-[color:var(--sf-status-error-text)]"
            role="status"
          >
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <XCircleIcon className="h-4 w-4" aria-hidden="true" />
              Live status
            </div>
            Live updates are currently offline. Bids will refresh once the
            connection returns.
          </div>
        )}
        {/* Auction Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#a020f0]/10">
            <img
              src={imageSrc}
              alt={auction.title}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={960}
              height={540}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex flex-col space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
              {auction.title}
            </h1>
            <p className="text-lg text-[color:var(--sf-mutedText)] leading-relaxed">
              {auction.description}
            </p>

            {/* Price + Highest Bidder */}
            <div className="p-6 bg-[color:var(--sf-surface)] rounded-[var(--sf-radius)] border border-[color:var(--sf-border)] shadow-[var(--sf-shadow)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
                <div>
                  <div
                    id="current-price-label"
                    className="text-sm text-[color:var(--sf-mutedText)] uppercase tracking-wider"
                  >
                    Current Price
                  </div>
                  <div
                    className="text-3xl font-bold text-[color:var(--sf-primary)]"
                    aria-labelledby="current-price-label"
                    aria-live="polite"
                  >
                    ${(auction.current_price ?? 0).toFixed(2)}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-sm text-[color:var(--sf-mutedText)] uppercase tracking-wider">
                    Time Remaining
                  </div>
                  <Countdown
                    // Assuming Countdown handles its own live announcements.
                    // If not, it should also have aria-live="polite".
                    endTime={auction.end_time}
                    status={auction.status}
                    onEnd={onTimerEnd}
                  />
                </div>
              </div>
              <div
                className="mt-4 pt-4 border-t border-[color:var(--sf-border)] text-[color:var(--sf-mutedText)] text-center sm:text-left"
                data-testid="highest-bidder-info"
              >
                <span aria-live="polite">Highest Bidder: </span>
                {highestBidderUsername ? (
                  <span className="font-semibold text-[color:var(--sf-text)]">
                    {highestBidderUsername}
                  </span>
                ) : (
                  "None"
                )}
              </div>
            </div>

            {/* Bidding Section */}
            {auction.status === "active" &&
              user &&
              !(user.is_admin || user.is_superuser) && (
                <>
                  {bidError && (
                    <div
                      className="rounded-lg border border-[color:var(--sf-status-error-border)] bg-[color:var(--sf-status-error-bg)] p-4 text-center text-[color:var(--sf-status-error-text)]"
                      role="alert"
                    >
                      <div className="mb-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <XCircleIcon className="h-4 w-4" aria-hidden="true" />
                        Bid error
                      </div>
                      {bidError}
                    </div>
                  )}
                  <Suspense
                    fallback={
                      <div className="text-center text-[color:var(--sf-mutedText)]">
                        Loading bid history...
                      </div>
                    }
                  >
                    <BidHistory bids={bids} />
                  </Suspense>
                  <button
                    onClick={onPlaceBid}
                    disabled={
                      isBidding ||
                      isBiddingBlockedByEmail ||
                      Number(user?.id) === Number(auction.highest_bidder_id)
                    }
                    title={
                      isBiddingBlockedByEmail
                        ? "Verify your email to place bids."
                        : undefined
                    }
                    className="mt-4 w-full text-lg bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-10 py-4 rounded-[var(--sf-radius)] font-bold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isBidding
                      ? "Placing Bid..."
                      : isBiddingBlockedByEmail
                        ? "Verify email to bid"
                        : Number(user?.id) === Number(auction.highest_bidder_id)
                          ? "You are the highest bidder"
                          : "Place Your Bid"}
                  </button>
                  {isBiddingBlockedByEmail ? (
                    <div className="mt-3 rounded-xl border border-[color:var(--sf-status-warning-border)] bg-[color:var(--sf-status-warning-bg)] px-4 py-3 text-sm text-[color:var(--sf-status-warning-text)]">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <ExclamationTriangleIcon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        Verification required
                      </div>
                      Verify your email to place bids.{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/account/verify-email")}
                        className="rounded font-semibold underline underline-offset-2 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-status-warning-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-status-warning-bg)]"
                      >
                        Verify now
                      </button>
                    </div>
                  ) : null}
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuctionView = memo(AuctionViewComponent);
