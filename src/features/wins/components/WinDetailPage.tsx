import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Page } from "@components/Page";
import { LoadingScreen } from "@components/LoadingScreen";
import { useAuth } from "@features/auth/hooks/useAuth";
import { winsApi } from "../api/winsApi";
import type {
  WinClaimAddress,
  WinDetail,
  WinFulfillmentStatus,
} from "../types/win";
import { parseApiError } from "@utils/apiError";
import axios from "axios";

const formatDate = (value: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatMoney = (amount: number, currency: string | null) => {
  if (currency && currency.length === 3) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount);
    } catch {
      // ignore invalid currency codes and fall back
    }
  }
  return `$${amount.toFixed(2)}`;
};

const statusMeta = (status: WinFulfillmentStatus) => {
  if (status === "pending" || status === "unclaimed") {
    return {
      label: "Awaiting claim",
      styles: "bg-amber-900 text-amber-100 border border-amber-300/40",
      action: "Claim prize",
    };
  }
  if (status === "claimed") {
    return {
      label: "Preparing shipment",
      styles: "bg-blue-900 text-blue-100 border border-blue-300/40",
      action: "View auction",
    };
  }
  if (status === "processing") {
    return {
      label: "Processing",
      styles: "bg-purple-900 text-purple-100 border border-purple-300/40",
      action: "View auction",
    };
  }
  if (status === "shipped") {
    return {
      label: "Shipped",
      styles: "bg-sky-900 text-sky-100 border border-sky-300/40",
      action: "View auction",
    };
  }
  if (status === "delivered" || status === "fulfilled") {
    return {
      label: "Completed",
      styles: "bg-green-900 text-green-100 border border-green-300/40",
      action: "View auction",
    };
  }
  if (status === "canceled" || status === "cancelled") {
    return {
      label: "Canceled",
      styles: "bg-red-900 text-red-100 border border-red-300/40",
      action: "View auction",
    };
  }
  return {
    label: "Unknown",
    styles: "bg-white/10 text-gray-200 border border-white/20",
    action: "View auction",
  };
};

const StatusBadge = ({ status }: { status: WinFulfillmentStatus }) => {
  const { label, styles } = useMemo(() => statusMeta(status), [status]);
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/10 space-y-1">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <div className="text-sm text-white">{value || "—"}</div>
  </div>
);

export const WinDetailPage = () => {
  const { auction_id } = useParams<{ auction_id: string }>();
  const location = useLocation();
  const { isReady, user } = useAuth();
  const [win, setWin] = useState<WinDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimCompleted, setClaimCompleted] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof WinClaimAddress, string>>
  >({});
  const [claimAddress, setClaimAddress] = useState<WinClaimAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });

  const loginRedirect = useMemo(
    () =>
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search,
      )}`,
    [location.pathname, location.search],
  );

  const handleLoad = useCallback(async () => {
    if (!auction_id) {
      setError("Invalid auction id.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setClaimCompleted(false);
    setShowClaimForm(false);
    setClaimError(null);
    setFieldErrors({});
    try {
      const data = await winsApi.get(auction_id);
      setWin(data);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.type === "not_found") {
        setError("Win not found.");
      } else if (parsed.type === "forbidden") {
        setError("You do not have access to this win.");
      } else {
        setError(parsed.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [auction_id]);

  const canClaim = win?.fulfillmentStatus === "pending";

  const validateClaim = (address: WinClaimAddress) => {
    const next: Partial<Record<keyof WinClaimAddress, string>> = {};
    const required: (keyof WinClaimAddress)[] = [
      "name",
      "line1",
      "city",
      "state",
      "postal_code",
      "country",
    ];
    for (const key of required) {
      if (!address[key]?.trim()) next[key] = "Required.";
    }
    return next;
  };

  const parseClaimValidationErrors = (
    err: unknown,
  ): {
    fields: Partial<Record<keyof WinClaimAddress, string>>;
    message: string | null;
  } => {
    if (!axios.isAxiosError(err)) {
      return { fields: {}, message: parseApiError(err).message };
    }

    const data = err.response?.data as unknown;
    if (!data || typeof data !== "object") {
      return { fields: {}, message: parseApiError(err).message };
    }

    const record = data as Record<string, unknown>;
    const errors = record.errors;
    if (!errors || typeof errors !== "object") {
      return { fields: {}, message: parseApiError(err).message };
    }

    const errorMapRoot = errors as Record<string, unknown>;
    const maybeShipping =
      errorMapRoot.shipping_address &&
      typeof errorMapRoot.shipping_address === "object"
        ? (errorMapRoot.shipping_address as Record<string, unknown>)
        : null;
    const errorMap = maybeShipping ?? errorMapRoot;
    const fields: Partial<Record<keyof WinClaimAddress, string>> = {};
    const keys: (keyof WinClaimAddress)[] = [
      "name",
      "line1",
      "line2",
      "city",
      "state",
      "postal_code",
      "country",
    ];

    for (const key of keys) {
      const value = errorMap[key];
      if (typeof value === "string" && value.trim()) {
        fields[key] = value;
      } else if (Array.isArray(value) && typeof value[0] === "string") {
        fields[key] = value[0];
      }
    }

    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message
        : null;
    return { fields, message };
  };

  const handleClaimSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auction_id || !win) return;

    setClaimError(null);
    setFieldErrors({});

    const clientErrors = validateClaim(claimAddress);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsClaiming(true);
    try {
      const updated = await winsApi.claim(auction_id, claimAddress);
      setWin({ ...updated, fulfillmentStatus: "claimed" });
      setClaimCompleted(true);
      setShowClaimForm(false);
      setClaimError(null);
      setFieldErrors({});
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.type === "validation") {
        const details = parseClaimValidationErrors(err);
        setFieldErrors(details.fields);
        setClaimError(
          details.message ?? "Please review the highlighted fields.",
        );
      } else {
        setClaimError(
          "We couldn't submit your claim right now. Please try again.",
        );
      }
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setWin(null);
      setError(null);
      return;
    }
    void handleLoad();
  }, [handleLoad, isReady, user?.id]);

  useEffect(() => {
    if (!isReady || !user || !auction_id) return;
    const intervalId = window.setInterval(() => {
      void winsApi
        .get(auction_id)
        .then((data) => setWin(data))
        .catch(() => {
          // keep existing state; errors are surfaced via manual retry
        });
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, [auction_id, isReady, user?.id]);

  if (!isReady) return <LoadingScreen item="win" />;

  if (!user) {
    return (
      <Page centered>
        <h2 className="font-serif text-4xl font-bold mb-3 text-white">
          Sign in to view this win
        </h2>
        <p className="mb-6 text-lg text-gray-400">
          You need an account to view your won auctions.
        </p>
        <Link
          to={loginRedirect}
          className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
        >
          Log In
        </Link>
      </Page>
    );
  }

  if (isLoading && !win) return <LoadingScreen item="win" />;

  if (error && !win) {
    return (
      <Page centered>
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-lg text-red-200 font-semibold">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => void handleLoad()}
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors"
            >
              Retry
            </button>
            <Link
              to="/account/wins"
              className="text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white transition-colors"
            >
              Back to wins
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  if (!win) return null;

  const meta = statusMeta(win.fulfillmentStatus);
  const showTracking =
    win.fulfillmentStatus === "shipped" &&
    (win.trackingNumber || win.shippingCarrier || win.trackingUrl);

  return (
    <Page>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Link
              to="/account/wins"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              ← Back to wins
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-400">
              Auction #{win.auctionId}
            </p>
            <h1 className="font-serif text-4xl font-bold text-white">
              {win.auctionTitle || "Won auction"}
            </h1>
            <p className="text-gray-400">Ended {formatDate(win.endedAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusBadge status={win.fulfillmentStatus} />
            <Link
              to={`/auctions/${win.auctionId}`}
              className="text-sm text-pink-200 hover:text-pink-100 underline underline-offset-2"
            >
              View auction
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryItem
            label="Final price"
            value={formatMoney(win.finalPrice, win.currency)}
          />
          <SummaryItem label="Ended" value={formatDate(win.endedAt)} />
          <SummaryItem label="Fulfillment" value={meta.label} />
        </div>

        {showTracking ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/10 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">Tracking</h3>
              {win.trackingUrl ? (
                <a
                  href={win.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-pink-200 hover:text-pink-100 underline underline-offset-2"
                >
                  Track package
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-gray-300">Carrier</span>
                <span className="font-semibold text-white">
                  {win.shippingCarrier || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-gray-300">Tracking #</span>
                <span className="font-semibold text-white break-all text-right">
                  {win.trackingNumber || "—"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {claimCompleted || win.fulfillmentStatus === "claimed" ? (
          <div className="rounded-2xl border border-green-400/30 bg-green-900/20 p-5 text-green-100 shadow-lg shadow-black/10">
            <p className="font-semibold">Claim submitted.</p>
            <p className="text-sm text-green-100/80 mt-1">
              We&apos;ll follow up if we need anything else.
            </p>
          </div>
        ) : null}

        {canClaim ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/10 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Claim prize
                </h3>
                <p className="text-sm text-gray-300">
                  Provide your shipping details to claim this win.
                </p>
              </div>
              {!showClaimForm ? (
                <button
                  onClick={() => setShowClaimForm(true)}
                  className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors whitespace-nowrap"
                >
                  Claim prize
                </button>
              ) : null}
            </div>

            {showClaimForm ? (
              <form className="space-y-4" onSubmit={handleClaimSubmit}>
                {claimError ? (
                  <p
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200"
                    role="alert"
                  >
                    {claimError}
                  </p>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      ["name", "Full name", "Jane Winner"],
                      ["line1", "Address line 1", "123 Main St"],
                      ["line2", "Address line 2 (optional)", "Apt 4"],
                      ["city", "City", "Austin"],
                      ["state", "State", "TX"],
                      ["postal_code", "Postal code", "78701"],
                      ["country", "Country", "US"],
                    ] as const
                  ).map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-2">
                      <label
                        htmlFor={`claim-${key}`}
                        className="block text-sm font-semibold text-white"
                      >
                        {label}
                      </label>
                      <input
                        id={`claim-${key}`}
                        name={key}
                        type="text"
                        value={claimAddress[key]}
                        onChange={(e) =>
                          setClaimAddress((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 shadow-inner shadow-black/10 outline-none transition focus:border-pink-400/70 focus:ring-2 focus:ring-pink-500/40"
                        placeholder={placeholder}
                        aria-invalid={fieldErrors[key] ? "true" : "false"}
                      />
                      {fieldErrors[key] ? (
                        <p className="text-xs text-red-200" role="alert">
                          {fieldErrors[key]}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClaimForm(false);
                      setClaimError(null);
                      setFieldErrors({});
                    }}
                    className="text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isClaiming}
                    className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors disabled:opacity-60"
                  >
                    {isClaiming ? "Submitting..." : "Submit claim"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {win.fulfillmentNote ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/10 space-y-2">
            <h3 className="text-lg font-semibold text-white">Notes</h3>
            <p className="text-sm text-gray-300">{win.fulfillmentNote}</p>
          </div>
        ) : null}
      </div>
    </Page>
  );
};
