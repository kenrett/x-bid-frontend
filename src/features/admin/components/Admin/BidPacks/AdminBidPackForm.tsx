import React, { useMemo, useState } from "react";
import type { BidPack } from "@features/auctions/types/bidPack";

type FormState = {
  name: string;
  description: string;
  bids: string;
  price: string;
  highlight: boolean;
};

interface AdminBidPackFormProps {
  initialValues?: Partial<BidPack>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (
    payload: Partial<BidPack> & { name: string },
  ) => Promise<void> | void;
}

const toFormState = (values?: Partial<BidPack>): FormState => ({
  name: values?.name ?? "",
  description: values?.description ?? "",
  bids: values?.bids !== undefined ? String(values.bids) : "",
  price: values?.price !== undefined ? String(values.price) : "",
  highlight: Boolean(values?.highlight),
});

const computePricePerBid = (state: FormState) => {
  const bids = Number(state.bids);
  const price = Number(state.price);
  if (!bids || Number.isNaN(bids) || Number.isNaN(price)) return "0.00";
  const value = price / bids;
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const compactPayload = (
  state: FormState,
): Partial<BidPack> & { name: string } => {
  const payload: Partial<BidPack> & { name: string } = {
    name: state.name.trim(),
    highlight: state.highlight,
  };

  const description = state.description.trim();
  if (description) {
    payload.description = description;
  }

  const bids = Number(state.bids);
  if (!Number.isNaN(bids)) {
    payload.bids = bids;
  }

  const price = Number(state.price);
  if (!Number.isNaN(price)) {
    payload.price = price;
  }

  payload.pricePerBid = computePricePerBid(state);

  return payload;
};

export const AdminBidPackForm = ({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
}: AdminBidPackFormProps) => {
  const [formState, setFormState] = useState<FormState>(() =>
    toFormState(initialValues),
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        key === "highlight"
          ? (event as React.ChangeEvent<HTMLInputElement>).target.checked
          : event.target.value;
      setFormState((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!formState.bids.trim() || Number.isNaN(Number(formState.bids))) {
      setError("Bids must be a number.");
      return;
    }
    if (!formState.price.trim() || Number.isNaN(Number(formState.price))) {
      setError("Price must be a number.");
      return;
    }

    setError(null);
    await onSubmit(compactPayload(formState));
  };

  const pricePerBid = useMemo(() => computePricePerBid(formState), [formState]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
          <span className="font-semibold">Name *</span>
          <input
            type="text"
            value={formState.name}
            onChange={handleChange("name")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            placeholder="Starter Pack"
            required
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-[color:var(--sf-mutedText)]">
          <input
            type="checkbox"
            checked={formState.highlight}
            onChange={handleChange("highlight")}
            className="h-4 w-4 rounded border-white/30 bg-white/10 text-[color:var(--sf-accent)] focus:ring-[color:var(--sf-focus-ring)]"
          />
          <span className="font-semibold">Highlight as featured</span>
        </label>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)] md:col-span-2">
          <span className="font-semibold">Description</span>
          <textarea
            value={formState.description}
            onChange={handleChange("description")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)] min-h-[100px]"
            placeholder="Short description for the pack."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
          <span className="font-semibold">Bids *</span>
          <input
            type="number"
            min={1}
            value={formState.bids}
            onChange={handleChange("bids")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            placeholder="50"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
          <span className="font-semibold">Price *</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={formState.price}
            onChange={handleChange("price")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            placeholder="9.99"
            required
          />
        </label>

        <div className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
          <span className="font-semibold">Price per bid</span>
          <div className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)]">
            ${pricePerBid}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-[color:var(--sf-text)] px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};
