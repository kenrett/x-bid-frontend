import axios from "axios";

type ApiErrorResult = {
  type: "network" | "validation" | "unauthorized" | "forbidden" | "not_found" | "server" | "unknown";
  message: string;
  code?: number;
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export const parseApiError = (error: unknown): ApiErrorResult => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = (error.response?.data as { error?: string })?.error || DEFAULT_MESSAGE;

    if (status === 401) return { type: "unauthorized", message, code: status };
    if (status === 403) return { type: "forbidden", message, code: status };
    if (status === 404) return { type: "not_found", message, code: status };
    if (status && status >= 500) return { type: "server", message, code: status };
    if (status && status >= 400) return { type: "validation", message, code: status };

    return { type: "network", message, code: status };
  }

  if (error instanceof Error) {
    return { type: "unknown", message: error.message || DEFAULT_MESSAGE };
  }

  return { type: "unknown", message: DEFAULT_MESSAGE };
};
