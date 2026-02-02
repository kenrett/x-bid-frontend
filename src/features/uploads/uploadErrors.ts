import { normalizeApiError } from "@api/normalizeApiError";
import type { UploadError } from "./types";

export const isUploadError = (value: unknown): value is UploadError => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.code === "string" &&
    typeof record.message === "string" &&
    typeof record.retryable === "boolean"
  );
};

export const normalizeUploadError = (error: unknown): UploadError => {
  if (isUploadError(error)) return error;

  const normalized = normalizeApiError(error, {
    fallbackMessage: "Upload failed. Please try again.",
  });

  if (normalized.status === 413) {
    return {
      code: "payload_too_large",
      message: normalized.message,
      retryable: false,
      status: normalized.status,
    };
  }

  if (normalized.status === 422) {
    return {
      code: "invalid_type",
      message: normalized.message,
      retryable: false,
      status: normalized.status,
    };
  }

  if (normalized.status === 401) {
    return {
      code: "auth_required",
      message: "Please sign in again to upload files.",
      retryable: false,
      status: normalized.status,
    };
  }

  if (normalized.status === 403) {
    return {
      code: "forbidden",
      message: "You do not have permission to upload files.",
      retryable: false,
      status: normalized.status,
    };
  }

  if (normalized.code === "network_error") {
    return {
      code: "network",
      message:
        "Network interruption detected. Check your connection and retry.",
      retryable: true,
      status: normalized.status,
    };
  }

  if (normalized.code === "timeout") {
    return {
      code: "timeout",
      message: "Upload timed out. Please try again.",
      retryable: true,
      status: normalized.status,
    };
  }

  if (normalized.status && normalized.status >= 500) {
    return {
      code: "server",
      message: normalized.message,
      retryable: true,
      status: normalized.status,
    };
  }

  return {
    code: "unknown",
    message: normalized.message,
    retryable: true,
    status: normalized.status,
  };
};
