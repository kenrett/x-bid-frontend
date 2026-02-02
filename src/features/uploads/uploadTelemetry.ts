import { getStorefrontKey } from "../../storefront/storefront";
import type { UploadError } from "./types";

export type UploadErrorCategory =
  | "network"
  | "auth"
  | "size"
  | "server"
  | "timeout"
  | "cancelled"
  | "validation"
  | "unknown";

export type UploadTelemetryEvent =
  | "upload_start"
  | "upload_retry"
  | "upload_success"
  | "upload_error"
  | "upload_cancel"
  | "upload_remove";

const categorizeUploadError = (error: UploadError): UploadErrorCategory => {
  switch (error.code) {
    case "network":
      return "network";
    case "auth_required":
    case "forbidden":
      return "auth";
    case "payload_too_large":
    case "file_too_large":
      return "size";
    case "server":
      return "server";
    case "timeout":
      return "timeout";
    case "cancelled":
      return "cancelled";
    case "invalid_type":
    case "invalid_dimensions":
      return "validation";
    default:
      return "unknown";
  }
};

export const logUploadEvent = (
  event: UploadTelemetryEvent,
  payload: {
    error?: UploadError;
    attempt?: number;
    maxAttempts?: number;
    fileName?: string;
    byteSize?: number;
  } = {},
) => {
  const storefront = getStorefrontKey();
  const errorCategory = payload.error
    ? categorizeUploadError(payload.error)
    : undefined;

  console.info("[upload]", {
    event,
    storefront,
    error_category: errorCategory,
    error_code: payload.error?.code,
    error_status: payload.error?.status,
    error_message: payload.error?.message,
    attempt: payload.attempt,
    max_attempts: payload.maxAttempts,
    file_name: payload.fileName,
    byte_size: payload.byteSize,
  });
};
