import type { LoginPayload } from "../types/auth";
import { normalizeUser } from "./user";

const readNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const readSessionTokenId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return String(value);
  return readNonEmptyString(value);
};

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

  const accessToken = readNonEmptyString(record.access_token);
  const refreshToken = readNonEmptyString(record.refresh_token);
  const sessionTokenId = readSessionTokenId(record.session_token_id);
  const userRecord = asRecord(record.user);

  const missing: string[] = [];
  if (!accessToken) missing.push("access_token");
  if (!refreshToken) missing.push("refresh_token");
  if (!sessionTokenId) missing.push("session_token_id");
  if (!userRecord) missing.push("user");

  if (missing.length) {
    throw new Error(
      `Unexpected auth response: missing required field(s): ${missing.join(", ")}`,
    );
  }

  const user = normalizeUser(userRecord);

  return {
    accessToken: accessToken!,
    refreshToken: refreshToken!,
    sessionTokenId: sessionTokenId!,
    user,
  };
};
