import React, { useMemo, useState } from "react";
import { addHours, format, isValid, parseISO, subHours } from "date-fns";
import type {
  AuctionSummary,
  AuctionStatus,
} from "@features/auctions/types/auction";
import { FileUploadField } from "@features/uploads/components/FileUploadField";
import { useUploadAdapter } from "@features/uploads/useUploadAdapter";
import type { UploadAdapter, UploadConstraints } from "@features/uploads/types";
import { DateTimePicker } from "@components/forms/DateTimePicker";

type FormPayload = Partial<AuctionSummary> & { title: string };

interface AdminAuctionFormProps {
  initialValues?: Partial<AuctionSummary>;
  onSubmit: (payload: FormPayload) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
  uploadAdapter?: UploadAdapter | null;
}

type FormState = {
  title: string;
  description: string;
  image_url: string;
  start_date: string | null;
  end_time: string | null;
  status: AuctionStatus | "";
  current_price: string;
};

const STATUS_OPTIONS: AuctionStatus[] = [
  "inactive",
  "scheduled",
  "active",
  "complete",
];

const AUCTION_IMAGE_CONSTRAINTS: UploadConstraints = {
  accept: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
  guidance: "Recommended 1200x800px. JPG, PNG, or WebP up to 5 MB.",
};

const toFormState = (values?: Partial<AuctionSummary>): FormState => ({
  title: values?.title ?? "",
  description: values?.description ?? "",
  image_url: values?.image_url ?? "",
  start_date: values?.start_date ?? null,
  end_time: values?.end_time ?? null,
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

  const optionalStrings: Array<
    [
      keyof Pick<
        FormState,
        "description" | "image_url" | "start_date" | "end_time"
      >,
      keyof AuctionSummary,
    ]
  > = [
    ["description", "description"],
    ["image_url", "image_url"],
    ["start_date", "start_date"],
    ["end_time", "end_time"],
  ];

  optionalStrings.forEach(([key, target]) => {
    const value = state[key];
    if (value && value.trim()) {
      // @ts-expect-error - indexed assignment for dynamic keys
      payload[target] = value.trim();
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

const formatISO = (value: Date) => format(value, "yyyy-MM-dd'T'HH:mm:ssXXX");

const validateSchedule = (start: string | null, end: string | null) => {
  let startError: string | undefined;
  let endError: string | undefined;

  if (start && !end) {
    endError = "End date & time is required";
  } else if (end && !start) {
    startError = "Start date & time is required";
  } else if (start && end) {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (isValid(startDate) && isValid(endDate) && endDate <= startDate) {
      endError = "End must be after start";
    }
  }

  return {
    startError,
    endError,
    isValid: !startError && !endError,
  };
};

export const AdminAuctionForm = ({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  uploadAdapter,
}: AdminAuctionFormProps) => {
  const [formState, setFormState] = useState<FormState>(() =>
    toFormState(initialValues),
  );
  const [error, setError] = useState<string | null>(null);
  const contextUploadAdapter = useUploadAdapter();
  const resolvedUploadAdapter = uploadAdapter ?? contextUploadAdapter;

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

    const scheduleCheck = validateSchedule(
      formState.start_date,
      formState.end_time,
    );
    if (!scheduleCheck.isValid) {
      return;
    }

    await onSubmit(compactPayload(formState));
  };

  const statusOptions = useMemo(() => STATUS_OPTIONS, []);
  const scheduleCheck = validateSchedule(
    formState.start_date,
    formState.end_time,
  );

  const handleStartChange = (nextISO: string | null) => {
    setFormState((prev) => {
      if (!nextISO) {
        return { ...prev, start_date: null };
      }

      if (!prev.end_time) {
        const parsed = parseISO(nextISO);
        const suggested = isValid(parsed)
          ? formatISO(addHours(parsed, 1))
          : null;
        return {
          ...prev,
          start_date: nextISO,
          end_time: suggested ?? prev.end_time ?? null,
        };
      }

      return { ...prev, start_date: nextISO };
    });
  };

  const handleEndChange = (nextISO: string | null) => {
    setFormState((prev) => {
      if (!nextISO) {
        return { ...prev, end_time: null };
      }

      if (!prev.start_date) {
        const parsed = parseISO(nextISO);
        const suggested = isValid(parsed)
          ? formatISO(subHours(parsed, 1))
          : null;
        return {
          ...prev,
          end_time: nextISO,
          start_date: suggested ?? prev.start_date ?? null,
        };
      }

      return { ...prev, end_time: nextISO };
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
          <span className="font-semibold">Title *</span>
          <input
            type="text"
            value={formState.title}
            onChange={handleChange("title")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            placeholder="e.g., Vintage Guitar Auction"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
          <span className="font-semibold">Status</span>
          <select
            value={formState.status}
            onChange={handleChange("status")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
          >
            <option value="">Select status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)] md:col-span-2">
          <span className="font-semibold">Description</span>
          <textarea
            value={formState.description}
            onChange={handleChange("description")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)] min-h-[120px]"
            placeholder="Short description for bidders."
          />
        </label>

        <div className="flex flex-col gap-4 text-sm text-[color:var(--sf-mutedText)] md:col-span-2">
          {resolvedUploadAdapter ? (
            <FileUploadField
              id="auction-image-upload"
              label="Upload image"
              description={AUCTION_IMAGE_CONSTRAINTS.guidance}
              helperText="Uploads are stored with Active Storage and ready for S3-backed direct uploads."
              value={formState.image_url}
              onChange={(nextUrl) =>
                setFormState((prev) => ({ ...prev, image_url: nextUrl }))
              }
              constraints={AUCTION_IMAGE_CONSTRAINTS}
              adapter={resolvedUploadAdapter}
            />
          ) : null}

          <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
            <span className="font-semibold">Image URL</span>
            <input
              type="url"
              value={formState.image_url}
              onChange={handleChange("image_url")}
              className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
              placeholder="https://example.com/image.jpg"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
          <span className="font-semibold">Current Price</span>
          <input
            type="number"
            value={formState.current_price}
            onChange={handleChange("current_price")}
            className="rounded-lg bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)]"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </label>

        <DateTimePicker
          label="Start date & time"
          valueISO={formState.start_date}
          onChangeISO={handleStartChange}
          error={scheduleCheck.startError}
          disabled={isSubmitting}
        />

        <DateTimePicker
          label="End date & time"
          valueISO={formState.end_time}
          onChangeISO={handleEndChange}
          minISO={formState.start_date ?? undefined}
          error={scheduleCheck.endError}
          disabled={isSubmitting}
        />
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
