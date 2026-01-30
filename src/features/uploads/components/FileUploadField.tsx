import { useMemo, useRef, useState } from "react";
import type { UploadAdapter, UploadConstraints, UploadError } from "../types";
import { normalizeUploadError } from "../uploadErrors";
import { validateUploadFile } from "../uploadValidation";

const BUTTON_CLASSES =
  "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

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
  const [status, setStatus] = useState<
    "idle" | "validating" | "uploading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<UploadError | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const accept = useMemo(() => constraints.accept.join(","), [constraints]);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const beginUpload = async (file: File) => {
    setError(null);
    setStatus("validating");
    const validationError = await validateUploadFile(file, constraints);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setProgress(0);

    try {
      const result = await adapter.upload({
        file,
        onProgress: (percent) => setProgress(percent),
      });
      onChange(result.url);
      setStatus("success");
      setProgress(100);
      setError(null);
      resetInput();
    } catch (err) {
      setError(normalizeUploadError(err));
      setStatus("error");
      setProgress(null);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLastFile(file);
    await beginUpload(file);
  };

  const handleRetry = async () => {
    if (!lastFile) return;
    await beginUpload(lastFile);
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
            {status === "validating" ? "Validating file..." : "Uploading..."}
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
          {status === "error" && error?.retryable && lastFile ? (
            <button
              type="button"
              className={BUTTON_CLASSES}
              onClick={handleRetry}
              disabled={disabled || isUploading}
            >
              Retry upload
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
