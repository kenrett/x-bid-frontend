import axios from "axios";
import { parseApiError } from "@utils/apiError";

export type FieldErrors = Record<string, string[]>;

export type AccountApiError = {
  status?: number;
  message: string;
  fieldErrors: FieldErrors;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const normalizeFieldErrors = (value: unknown): FieldErrors => {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const result: FieldErrors = {};

  for (const [key, raw] of Object.entries(record)) {
    if (isStringArray(raw)) {
      result[key] = raw;
      continue;
    }
    if (typeof raw === "string" && raw.trim() !== "") {
      result[key] = [raw];
      continue;
    }
  }

  return result;
};

const normalizeErrorList = (value: unknown): string[] => {
  if (isStringArray(value)) return value;
  if (typeof value === "string" && value.trim() !== "") return [value];
  return [];
};

export const parseAccountApiError = (error: unknown): AccountApiError => {
  const base = parseApiError(error);
  let status: number | undefined;
  let fieldErrors: FieldErrors = {};
  let message = base.message;

  if (axios.isAxiosError(error)) {
    status = error.response?.status;
    const data = error.response?.data as unknown;
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if ("errors" in record) {
        const errors = record.errors;
        const normalizedFields = normalizeFieldErrors(errors);
        if (Object.keys(normalizedFields).length) {
          fieldErrors = normalizedFields;
          const first = Object.values(fieldErrors)[0]?.[0];
          if (first) message = first;
        } else {
          const list = normalizeErrorList(errors);
          if (list.length) message = list.join("\n");
        }
      }
    }
  }

  if (status === 429 && message === base.message) {
    message = "Too many requests. Please wait and try again.";
  }

  return {
    status,
    message,
    fieldErrors,
  };
};
