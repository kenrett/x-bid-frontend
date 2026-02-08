import { useEffect, useId, useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";

export type DateTimePickerProps = {
  label: string;
  valueISO?: string | null;
  onChangeISO: (nextISO: string | null) => void;
  minISO?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  error?: string;
};

const buildISO = (dateValue: string, timeValue: string) => {
  if (!dateValue || !timeValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map((part) => Number(part));
  const [hours, minutes] = timeValue.split(":").map((part) => Number(part));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  const nextDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (!isValid(nextDate)) {
    return null;
  }

  return format(nextDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
};

const getTimeZoneLabel = (date: Date) => {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short",
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "local";
  } catch {
    return "local";
  }
};

const buildTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minutes = 0; minutes < 60; minutes += 15) {
      const hourLabel = String(hour).padStart(2, "0");
      const minuteLabel = String(minutes).padStart(2, "0");
      options.push(`${hourLabel}:${minuteLabel}`);
    }
  }
  return options;
};

export const DateTimePicker = ({
  label,
  valueISO,
  onChangeISO,
  minISO,
  required,
  disabled,
  helpText,
  error,
}: DateTimePickerProps) => {
  const id = useId();
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");

  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const minDate = useMemo(() => {
    if (!minISO) {
      return null;
    }
    const parsed = parseISO(minISO);
    return isValid(parsed) ? parsed : null;
  }, [minISO]);

  const minDateValue = minDate ? format(minDate, "yyyy-MM-dd") : undefined;
  const minTimeValue = minDate ? format(minDate, "HH:mm") : undefined;

  useEffect(() => {
    if (!valueISO) {
      setDateValue("");
      setTimeValue("");
      return;
    }

    const parsed = parseISO(valueISO);
    if (!isValid(parsed)) {
      setDateValue("");
      setTimeValue("");
      return;
    }

    setDateValue(format(parsed, "yyyy-MM-dd"));
    setTimeValue(format(parsed, "HH:mm"));
  }, [valueISO]);

  const emitChange = (nextDate: string, nextTime: string) => {
    const nextISO = buildISO(nextDate, nextTime);
    onChangeISO(nextISO);
  };

  const handleDateChange = (nextDate: string) => {
    setDateValue(nextDate);
    emitChange(nextDate, timeValue);
  };

  const handleTimeChange = (nextTime: string) => {
    setTimeValue(nextTime);
    emitChange(dateValue, nextTime);
  };

  const handleClear = () => {
    setDateValue("");
    setTimeValue("");
    onChangeISO(null);
  };

  const previewDate =
    dateValue && timeValue ? buildISO(dateValue, timeValue) : null;
  const previewLabel = previewDate
    ? (() => {
        const parsed = parseISO(previewDate);
        if (!isValid(parsed)) {
          return "";
        }
        const dateLabel = format(parsed, "EEE MMM d, yyyy");
        const timeLabel = format(parsed, "h:mm a");
        const tzLabel = getTimeZoneLabel(parsed);
        return `${dateLabel} at ${timeLabel} ${tzLabel}`;
      })()
    : "";

  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2 text-sm text-[color:var(--sf-mutedText)]">
      <span className="font-semibold">{label}</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
            Date
          </span>
          <input
            id={`${id}-date`}
            type="date"
            value={dateValue}
            onChange={(event) => handleDateChange(event.target.value)}
            className={`rounded-lg bg-[color:var(--sf-surface)] border px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)] ${
              error ? "border-pink-500" : "border-[color:var(--sf-border)]"
            }`}
            min={minDateValue}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[color:var(--sf-mutedText)]">
            Time
          </span>
          <select
            id={`${id}-time`}
            value={timeValue}
            onChange={(event) => handleTimeChange(event.target.value)}
            className={`rounded-lg bg-[color:var(--sf-surface)] border px-3 py-2 text-[color:var(--sf-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--sf-focus-ring)] ${
              error ? "border-pink-500" : "border-[color:var(--sf-border)]"
            }`}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          >
            <option value="">Select time</option>
            {timeOptions.map((option) => {
              const isMinDate = minTimeValue && dateValue === minDateValue;
              const isDisabled = isMinDate ? option < minTimeValue : false;
              return (
                <option key={option} value={option} disabled={isDisabled}>
                  {option}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-semibold text-[color:var(--sf-accent)] hover:text-[color:var(--sf-accent)]"
          disabled={disabled}
        >
          Clear
        </button>
        {previewLabel ? (
          <span className="text-xs text-[color:var(--sf-mutedText)]">
            {previewLabel}
          </span>
        ) : (
          <span className="text-xs text-[color:var(--sf-mutedText)]">
            No date/time selected
          </span>
        )}
      </div>

      {helpText ? (
        <p id={helpId} className="text-xs text-[color:var(--sf-mutedText)]">
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-[color:var(--sf-accent)]">
          {error}
        </p>
      ) : null}
    </div>
  );
};
