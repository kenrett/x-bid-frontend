import type { LoginPayload } from "../types/auth";
import { normalizeUser } from "./user";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

export const normalizeAuthResponse = (raw: unknown): LoginPayload => {
  if (!raw || typeof raw !== "object") {
    const snippet =
      typeof raw === "string"
        ? raw.slice(0, 180)
        : raw === null
          ? "null"
          : String(raw);
    throw new Error(
      `Unexpected auth response: expected JSON object but received ${typeof raw}: ${snippet}`,
    );
  }

  const record = asRecord(raw);
  if (!record) {
    throw new Error("Unexpected auth response: expected JSON object");
  }

  const accessToken =
    typeof record.access_token === "string" && record.access_token.trim()
      ? record.access_token
      : null;
  const refreshToken =
    typeof record.refresh_token === "string" && record.refresh_token.trim()
      ? record.refresh_token
      : null;
  const userRecord = asRecord(record.user);

  const missing: string[] = [];
  if (!accessToken) missing.push("access_token");
  if (!userRecord) missing.push("user");

  if (missing.length) {
    throw new Error(
      `Unexpected auth response: missing required field(s): ${missing.join(", ")}`,
    );
  }

  const user = normalizeUser(userRecord!);

  return { user, accessToken, refreshToken };
};
