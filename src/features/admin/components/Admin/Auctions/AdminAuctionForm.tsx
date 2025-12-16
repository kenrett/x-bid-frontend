import React, { useMemo, useState } from "react";
import type {
  AuctionSummary,
  AuctionStatus,
} from "@features/auctions/types/auction";

type FormPayload = Partial<AuctionSummary> & { title: string };

interface AdminAuctionFormProps {
  initialValues?: Partial<AuctionSummary>;
  onSubmit: (payload: FormPayload) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
}

type FormState = {
  title: string;
  description: string;
  image_url: string;
  start_date: string;
  end_time: string;
  status: AuctionStatus | "";
  current_price: string;
};

const STATUS_OPTIONS: AuctionStatus[] = [
  "inactive",
  "scheduled",
  "active",
  "complete",
];

const toFormState = (values?: Partial<AuctionSummary>): FormState => ({
  title: values?.title ?? "",
  description: values?.description ?? "",
  image_url: values?.image_url ?? "",
  start_date: values?.start_date ?? "",
  end_time: values?.end_time ?? "",
  status: values?.status ?? "",
  current_price:
    values?.current_price !== undefined && values?.current_price !== null
      ? String(values.current_price)
      : "",
});

const compactPayload = (state: FormState): FormPayload => {
  const payload: FormPayload = {
    title: state.title.trim(),
  };

  const optionalStrings: Array<[keyof FormState, keyof AuctionSummary]> = [
    ["description", "description"],
    ["image_url", "image_url"],
    ["start_date", "start_date"],
    ["end_time", "end_time"],
  ];

  optionalStrings.forEach(([key, target]) => {
    const value = state[key].trim();
    if (value) {
      // @ts-expect-error - indexed assignment for dynamic keys
      payload[target] = value;
    }
  });

  if (state.status) {
    payload.status = state.status;
  }

  const price = state.current_price.trim();
  if (price) {
    const parsed = Number(price);
    if (!Number.isNaN(parsed)) {
      payload.current_price = parsed;
    }
  }

  return payload;
};

export const AdminAuctionForm = ({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
}: AdminAuctionFormProps) => {
  const [formState, setFormState] = useState<FormState>(() =>
    toFormState(initialValues),
  );
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (key: keyof FormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setFormState((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = formState.title.trim();
    if (!title) {
      setError("Title is required.");
      return;
    }

    setError(null);
    await onSubmit(compactPayload(formState));
  };

  const statusOptions = useMemo(() => STATUS_OPTIONS, []);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="flex flex-col gap-2 text-sm text-gray-200">
          <span className="font-semibold">Title *</span>
          <input
            type="text"
            value={formState.title}
            onChange={handleChange("title")}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="e.g., Vintage Guitar Auction"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-200">
          <span className="font-semibold">Status</span>
          <select
            value={formState.status}
            onChange={handleChange("status")}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Select status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-200 md:col-span-2">
          <span className="font-semibold">Description</span>
          <textarea
            value={formState.description}
            onChange={handleChange("description")}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[120px]"
            placeholder="Short description for bidders."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-200">
          <span className="font-semibold">Image URL</span>
          <input
            type="url"
            value={formState.image_url}
            onChange={handleChange("image_url")}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="https://example.com/image.jpg"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-200">
          <span className="font-semibold">Current Price</span>
          <input
            type="number"
            value={formState.current_price}
            onChange={handleChange("current_price")}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-200">
          <span className="font-semibold">Start Date</span>
          <input
            type="text"
            value={formState.start_date}
            onChange={handleChange("start_date")}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="2024-06-01T12:00:00Z"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-200">
          <span className="font-semibold">End Time</span>
          <input
            type="text"
            value={formState.end_time}
            onChange={handleChange("end_time")}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="2024-06-01T14:00:00Z"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};
