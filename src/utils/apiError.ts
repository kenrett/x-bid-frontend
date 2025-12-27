import axios from "axios";

type ApiErrorResult = {
  type:
    | "network"
    | "validation"
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "server"
    | "unknown";
  message: string;
  code?: number | string;
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

type ParsedErrorBody = {
  message?: string;
  code?: string | number;
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

const parseErrorBody = (data: unknown): ParsedErrorBody => {
  if (!data || typeof data !== "object") return {};

  const maybeErrorCode = (data as { error_code?: string }).error_code;
  const maybeMessage = (data as { message?: string }).message;
  if (typeof maybeMessage === "string") {
    return {
      message: maybeMessage,
      code: maybeErrorCode ?? (maybeMessage ? undefined : maybeErrorCode),
    };
  }

  const errorField = (data as { error?: unknown }).error;
  if (typeof errorField === "string") {
    return { message: errorField };
  }

  if (errorField && typeof errorField === "object") {
    const errorObj = errorField as { code?: string; message?: string };
    if (typeof errorObj.message === "string") {
      return { message: errorObj.message, code: errorObj.code };
    }
  }

  return {};
};

export const parseApiError = (error: unknown): ApiErrorResult => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const supportId = getSupportId(error.response?.headers);
    const parsedBody = parseErrorBody(error.response?.data);
    const messageBase = parsedBody.message || DEFAULT_MESSAGE;
    const message =
      status && status >= 500 && supportId
        ? `${messageBase} (support id: ${supportId})`
        : messageBase;
    const code = parsedBody.code ?? status;

    if (status === 401) return { type: "unauthorized", message, code };
    if (status === 403) return { type: "forbidden", message, code };
    if (status === 404) return { type: "not_found", message, code };
    if (status && status >= 500) return { type: "server", message, code };
    if (status && status >= 400) return { type: "validation", message, code };

    return { type: "network", message, code };
  }

  if (error instanceof Error) {
    return { type: "unknown", message: error.message || DEFAULT_MESSAGE };
  }

  return { type: "unknown", message: DEFAULT_MESSAGE };
};
