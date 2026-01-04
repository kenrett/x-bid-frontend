import axios from "axios";
import { normalizeApiError } from "@api/normalizeApiError";
import type { FieldErrors, NormalizedApiError } from "@api/normalizeApiError";

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

export const parseApiError = (error: unknown): ApiErrorResult => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return { type: "unknown", message: error.message || DEFAULT_MESSAGE };
    }
    return { type: "unknown", message: DEFAULT_MESSAGE };
  }

  const normalized = normalizeApiError(error);
  const status = normalized.status;
  const code =
    normalized.code.startsWith("http_") && status ? status : normalized.code;

  if (status === 401)
    return { type: "unauthorized", message: normalized.message, code };
  if (status === 403)
    return { type: "forbidden", message: normalized.message, code };
  if (status === 404)
    return { type: "not_found", message: normalized.message, code };
  if (status && status >= 500)
    return { type: "server", message: normalized.message, code };
  if (status && status >= 400)
    return { type: "validation", message: normalized.message, code };
  if (!status) return { type: "network", message: normalized.message, code };

  return { type: "unknown", message: normalized.message, code };
};

type NormalizeOptions = {
  fallbackMessage?: string;
  useRawErrorMessage?: boolean;
};

export type ApiErrorDetails = NormalizedApiError & {
  type: ApiErrorResult["type"];
  fieldErrors: FieldErrors;
};

export const getApiErrorDetails = (
  error: unknown,
  options: NormalizeOptions = {},
): ApiErrorDetails => {
  const normalized = normalizeApiError(error, options);
  const status = normalized.status;

  const type: ApiErrorResult["type"] = (() => {
    if (status === 401) return "unauthorized";
    if (status === 403) return "forbidden";
    if (status === 404) return "not_found";
    if (status && status >= 500) return "server";
    if (status && status >= 400) return "validation";
    if (!status) return "network";
    return "unknown";
  })();

  return {
    ...normalized,
    type,
    fieldErrors: normalized.fieldErrors ?? {},
  };
};
