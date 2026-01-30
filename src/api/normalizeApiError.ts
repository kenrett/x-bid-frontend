import axios from "axios";

export type FieldErrors = Record<string, string[]>;

export type NormalizedApiError = {
  code: string;
  message: string;
  fieldErrors?: FieldErrors;
  status?: number;
};

type NormalizeOptions = {
  /**
   * Used when we can't confidently extract a user-facing message from a response.
   * Defaults to a generic message.
   */
  fallbackMessage?: string;
  /**
   * When false, do not surface `Error.message` for non-Axios errors (use
   * `fallbackMessage` instead).
   */
  useRawErrorMessage?: boolean;
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const normalizeFieldErrors = (value: unknown): FieldErrors | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const result: FieldErrors = {};

  for (const [key, raw] of Object.entries(record)) {
    if (isStringArray(raw)) {
      result[key] = raw.filter((entry) => entry.trim() !== "");
      continue;
    }
    if (typeof raw === "string" && raw.trim() !== "") {
      result[key] = [raw];
      continue;
    }
  }

  return Object.keys(result).length ? result : undefined;
};

const normalizeErrorList = (value: unknown): string[] => {
  if (isStringArray(value)) return value.filter((entry) => entry.trim() !== "");
  if (typeof value === "string" && value.trim() !== "") return [value.trim()];
  return [];
};

const getHeaderValue = (headers: unknown, key: string): string | undefined => {
  if (!headers || typeof headers !== "object") return undefined;
  const record = headers as Record<string, unknown>;
  const needle = key.toLowerCase();

  for (const [headerKey, value] of Object.entries(record)) {
    if (headerKey.toLowerCase() !== needle) continue;
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return undefined;
  }

  return undefined;
};

const getSupportId = (headers: unknown): string | undefined =>
  getHeaderValue(headers, "x-request-id") ??
  getHeaderValue(headers, "rndr-id") ??
  getHeaderValue(headers, "cf-ray");

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;

const pickCodeMessage = (
  data: unknown,
): { code?: string; message?: string } => {
  const record = asRecord(data);
  if (!record) return {};

  const maybeMessage = record.message;
  const maybeErrorCode = record.error_code ?? record.errorCode;

  if (typeof maybeMessage === "string" && maybeMessage.trim() !== "") {
    return {
      message: maybeMessage.trim(),
      code:
        typeof maybeErrorCode === "string" || typeof maybeErrorCode === "number"
          ? String(maybeErrorCode)
          : undefined,
    };
  }

  const errorField = record.error;
  if (typeof errorField === "string" && errorField.trim() !== "") {
    return { message: errorField.trim() };
  }

  const errorObj = asRecord(errorField);
  if (
    errorObj &&
    typeof errorObj.message === "string" &&
    errorObj.message.trim() !== ""
  ) {
    const rawCode = errorObj.code;
    return {
      message: errorObj.message.trim(),
      code:
        typeof rawCode === "string" || typeof rawCode === "number"
          ? String(rawCode)
          : undefined,
    };
  }

  return {};
};

const pickFieldErrorsFromBody = (data: unknown): FieldErrors | undefined => {
  const record = asRecord(data);
  if (!record) return undefined;

  // Legacy Rails-ish: { errors: { field: ["..."] } } or { errors: ["..."] }.
  if ("errors" in record) {
    const maybeFields = normalizeFieldErrors(record.errors);
    if (maybeFields) return maybeFields;
  }

  const details = asRecord(record.details);
  if (!details) return undefined;

  const candidates = [
    details.field_errors,
    details.fieldErrors,
    details.errors,
    details.fields,
  ];

  for (const candidate of candidates) {
    const maybeFields = normalizeFieldErrors(candidate);
    if (maybeFields) return maybeFields;
  }

  return undefined;
};

const pickFallbackMessageFromBody = (data: unknown): string | undefined => {
  const record = asRecord(data);
  if (!record) return undefined;

  if ("errors" in record) {
    const list = normalizeErrorList(record.errors);
    if (list.length) return list.join("\n");
  }

  const details = asRecord(record.details);
  if (details && "errors" in details) {
    const list = normalizeErrorList(details.errors);
    if (list.length) return list.join("\n");
  }

  return undefined;
};

const defaultMessageForStatus = (status: number | undefined) => {
  if (status === 429) return "Too many requests. Please wait and try again.";
  if (status === 413)
    return "Upload is too large. Please choose a smaller file.";
  if (status === 401) return "Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "Not found.";
  return DEFAULT_MESSAGE;
};

export const normalizeApiError = (
  error: unknown,
  options: NormalizeOptions = {},
): NormalizedApiError => {
  const fallbackMessage = options.fallbackMessage ?? DEFAULT_MESSAGE;
  const useRawErrorMessage = options.useRawErrorMessage ?? true;

  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      const message =
        useRawErrorMessage && error.message.trim()
          ? error.message.trim()
          : fallbackMessage;
      return { code: "unknown_error", message };
    }
    return { code: "unknown_error", message: fallbackMessage };
  }

  const status = error.response?.status;
  const supportId = getSupportId(error.response?.headers);
  const data = error.response?.data as unknown;

  const { code: bodyCode, message: bodyMessage } = pickCodeMessage(data);
  const fieldErrors = pickFieldErrorsFromBody(data);
  const fallbackFromErrors = pickFallbackMessageFromBody(data);

  const messageFromFields = fieldErrors
    ? Object.values(fieldErrors)[0]?.[0]
    : undefined;

  const baseMessage =
    bodyMessage ??
    messageFromFields ??
    fallbackFromErrors ??
    options.fallbackMessage ??
    defaultMessageForStatus(status);

  const message =
    status && status >= 500 && supportId
      ? `${baseMessage} (support id: ${supportId})`
      : baseMessage;

  const code = bodyCode ?? (status ? `http_${status}` : "network_error");

  return {
    code,
    message,
    fieldErrors,
    status,
  };
};
