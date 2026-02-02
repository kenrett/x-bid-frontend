import { useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "@services/toast";
import type { UploadAdapter, UploadConstraints, UploadError } from "../types";
import { normalizeUploadError } from "../uploadErrors";
import { validateUploadFile } from "../uploadValidation";
import { logUploadEvent } from "../uploadTelemetry";

const BUTTON_CLASSES =
  "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 700;
const RETRY_MAX_DELAY_MS = 4000;
const UPLOAD_TIMEOUT_MS = 30_000;

type FileUploadFieldProps = {
  id: string;
  label: string;
  description?: string;
  helperText?: string;
  value?: string;
  onChange: (value: string) => void;
  constraints: UploadConstraints;
  adapter: UploadAdapter;
  disabled?: boolean;
  allowUrlPreview?: boolean;
  ariaDescriptionId?: string;
};

export const FileUploadField = ({
  id,
  label,
  description,
  helperText,
  value,
  onChange,
  constraints,
  adapter,
  disabled,
  allowUrlPreview = true,
  ariaDescriptionId,
}: FileUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const abortReasonRef = useRef<"timeout" | "cancelled" | null>(null);
  const uploadTokenRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const [status, setStatus] = useState<
    "idle" | "validating" | "uploading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<UploadError | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);

  const accept = useMemo(() => constraints.accept.join(","), [constraints]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const buildBackoffDelay = (currentAttempt: number) => {
    const base = RETRY_BASE_DELAY_MS * Math.pow(2, currentAttempt - 1);
    const jitter = Math.floor(Math.random() * 200);
    return Math.min(base + jitter, RETRY_MAX_DELAY_MS);
  };

  const resetState = () => {
    setStatus("idle");
    setError(null);
    setProgress(null);
    setAttempt(0);
    setMaxAttempts(1);
  };

  const beginUpload = async (file: File, attempts = 1) => {
    const uploadToken = ++uploadTokenRef.current;
    setError(null);
    setStatus("validating");
    setAttempt(0);
    setMaxAttempts(attempts);

    const validationError = await validateUploadFile(file, constraints);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      logUploadEvent("upload_error", {
        error: validationError,
        fileName: file.name,
        byteSize: file.size,
      });
      return;
    }

    for (let nextAttempt = 1; nextAttempt <= attempts; nextAttempt += 1) {
      if (uploadTokenRef.current !== uploadToken) return;
      setError(null);
      setStatus("uploading");
      setProgress(0);
      setAttempt(nextAttempt);
      logUploadEvent(nextAttempt === 1 ? "upload_start" : "upload_retry", {
        attempt: nextAttempt,
        maxAttempts: attempts,
        fileName: file.name,
        byteSize: file.size,
      });

      const controller = new AbortController();
      abortControllerRef.current = controller;
      abortReasonRef.current = null;
      clearTimeoutRef();
      timeoutRef.current = window.setTimeout(() => {
        abortReasonRef.current = "timeout";
        controller.abort();
      }, UPLOAD_TIMEOUT_MS);

      try {
        const result = await adapter.upload({
          file,
          onProgress: (percent) => {
            if (uploadTokenRef.current !== uploadToken) return;
            setProgress(percent);
          },
          signal: controller.signal,
        });
        if (uploadTokenRef.current !== uploadToken) return;
        clearTimeoutRef();
        onChange(result.url);
        setStatus("success");
        setProgress(100);
        setError(null);
        resetInput();
        logUploadEvent("upload_success", {
          attempt: nextAttempt,
          maxAttempts: attempts,
          fileName: file.name,
          byteSize: file.size,
        });
        return;
      } catch (rawError) {
        clearTimeoutRef();
        if (uploadTokenRef.current !== uploadToken) return;

        let normalizedError: UploadError;
        if (abortReasonRef.current === "timeout") {
          normalizedError = {
            code: "timeout",
            message: "Upload timed out. Please try again.",
            retryable: true,
          };
        } else if (abortReasonRef.current === "cancelled") {
          normalizedError = {
            code: "cancelled",
            message: "Upload cancelled.",
            retryable: true,
          };
        } else {
          normalizedError = normalizeUploadError(rawError);
        }

        abortReasonRef.current = null;
        setError(normalizedError);
        setStatus("error");
        setProgress(null);
        logUploadEvent("upload_error", {
          error: normalizedError,
          attempt: nextAttempt,
          maxAttempts: attempts,
          fileName: file.name,
          byteSize: file.size,
        });
        showToast(normalizedError.message, "error");

        if (!normalizedError.retryable || nextAttempt >= attempts) {
          return;
        }

        const delay = buildBackoffDelay(nextAttempt);
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLastFile(file);
    await beginUpload(file, 1);
  };

  const handleRetry = async () => {
    if (!lastFile) return;
    await beginUpload(lastFile, MAX_ATTEMPTS);
  };

  const handleCancel = () => {
    if (!abortControllerRef.current) return;
    abortReasonRef.current = "cancelled";
    abortControllerRef.current.abort();
    logUploadEvent("upload_cancel", {
      fileName: lastFile?.name,
      byteSize: lastFile?.size,
      attempt,
      maxAttempts,
    });
  };

  const handleRemove = () => {
    abortReasonRef.current = "cancelled";
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearTimeoutRef();
    setLastFile(null);
    resetInput();
    resetState();
    onChange("");
    logUploadEvent("upload_remove");
  };

  const isUploading = status === "uploading" || status === "validating";

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <label htmlFor={id} className="text-sm font-semibold text-gray-200">
            {label}
          </label>
          {description ? (
            <p className="text-xs text-gray-400">{description}</p>
          ) : null}
          {helperText ? (
            <p className="text-xs text-gray-400">{helperText}</p>
          ) : null}
        </div>
        {status === "success" ? (
          <span className="text-xs font-semibold text-green-300">Uploaded</span>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          aria-describedby={ariaDescriptionId}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="block w-full text-sm text-gray-200 file:mr-4 file:rounded-lg file:border-0 file:bg-pink-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-pink-400 disabled:opacity-60"
        />

        {status === "uploading" || status === "validating" ? (
          <div className="text-xs text-gray-300" aria-live="polite">
            {status === "validating"
              ? "Validating file..."
              : `Uploading...${attempt && maxAttempts > 1 ? ` (attempt ${attempt}/${maxAttempts})` : ""}`}
            {status === "uploading" && progress !== null ? ` ${progress}%` : ""}
          </div>
        ) : null}

        {status === "error" && error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-100"
          >
            {error.message}
          </div>
        ) : null}

        {status === "success" && value && allowUrlPreview ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Uploaded image preview</div>
            <img
              src={value}
              alt="Uploaded preview"
              className="h-28 w-auto rounded-lg border border-white/10 object-cover"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {isUploading ? (
            <button
              type="button"
              className={BUTTON_CLASSES}
              onClick={handleCancel}
              disabled={disabled}
            >
              Cancel upload
            </button>
          ) : null}
          {status === "error" && error?.retryable && lastFile ? (
            <button
              type="button"
              className={BUTTON_CLASSES}
              onClick={handleRetry}
              disabled={disabled || isUploading}
            >
              Try again
            </button>
          ) : null}
          {status === "error" && lastFile ? (
            <button
              type="button"
              className={BUTTON_CLASSES}
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              Choose different file
            </button>
          ) : null}
          {lastFile && status !== "uploading" && status !== "validating" ? (
            <button
              type="button"
              className={BUTTON_CLASSES}
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              Remove file
            </button>
          ) : null}
          {status === "success" ? (
            <button
              type="button"
              className={BUTTON_CLASSES}
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              Replace file
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
