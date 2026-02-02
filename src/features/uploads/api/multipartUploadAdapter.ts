import client from "@api/client";
import { getStorefrontKey } from "../../../storefront/storefront";
import type { UploadAdapter, UploadError, UploadResult } from "../types";

const DEFAULT_FIELD = "file";
const MAX_STRING_LENGTH = 600;
const MAX_ARRAY_ITEMS = 12;
const MAX_OBJECT_KEYS = 12;

const pickUploadUrl = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  return typeof record.url === "string" ? record.url : undefined;
};

const redactValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    if (value.length <= MAX_STRING_LENGTH) return value;
    return `${value.slice(0, MAX_STRING_LENGTH)}… (${value.length} chars)`;
  }

  if (Array.isArray(value)) {
    const trimmed = value.slice(0, MAX_ARRAY_ITEMS).map(redactValue);
    return value.length > MAX_ARRAY_ITEMS
      ? [...trimmed, `… (${value.length - MAX_ARRAY_ITEMS} more)`]
      : trimmed;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.entries(record).slice(0, MAX_OBJECT_KEYS);
    const result: Record<string, unknown> = {};
    entries.forEach(([key, entryValue]) => {
      result[key] = redactValue(entryValue);
    });
    if (Object.keys(record).length > MAX_OBJECT_KEYS) {
      result.__truncated = `… (${Object.keys(record).length - MAX_OBJECT_KEYS} more keys)`;
    }
    return result;
  }

  return value;
};

export const createMultipartUploadAdapter = (options: {
  endpoint: string;
  fieldName?: string;
  resolveUrl?: (data: unknown) => string | undefined;
  extraFields?: Record<string, string>;
}): UploadAdapter => {
  const fieldName = options.fieldName ?? DEFAULT_FIELD;
  const resolveUrl = options.resolveUrl ?? pickUploadUrl;

  return {
    upload: async ({ file, onProgress, signal }) => {
      const formData = new FormData();
      formData.append(fieldName, file);

      if (options.extraFields) {
        Object.entries(options.extraFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      if (import.meta.env.DEV) {
        console.info("[upload] request", {
          storefront: getStorefrontKey(),
          endpoint: options.endpoint,
          file_name: file.name,
          byte_size: file.size,
        });
      }

      const response = await client.post(options.endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal,
        onUploadProgress: (event) => {
          if (!event.total || !onProgress) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        },
      });

      const url = resolveUrl(response.data);
      if (!url) {
        throw {
          code: "unknown",
          message: "Upload succeeded but no URL was returned.",
          retryable: false,
          responseBody: redactValue(response.data),
        } satisfies UploadError;
      }

      return {
        url,
        fileName: file.name,
        byteSize: file.size,
        contentType: file.type,
      } satisfies UploadResult;
    },
  };
};
