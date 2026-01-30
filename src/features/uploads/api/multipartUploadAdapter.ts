import client from "@api/client";
import type { UploadAdapter, UploadError, UploadResult } from "../types";

const DEFAULT_FIELD = "file";

const pickUploadUrl = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const candidates = [
    record.url,
    record.file_url,
    record.image_url,
    record.upload_url,
  ];
  const match = candidates.find((value) => typeof value === "string");
  return match as string | undefined;
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
