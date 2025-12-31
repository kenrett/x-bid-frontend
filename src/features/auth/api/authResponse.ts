import type { LoginPayload } from "../types/auth";
import { normalizeUser } from "./user";

type AuthApiResponse = Record<string, unknown>;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const readSessionTokenId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return String(value);
  return readString(value);
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

function requireAuthFields(fields: {
  token: string | null;
  refreshToken: string | null;
  sessionTokenId: string | null;
  userRecord: Record<string, unknown> | null;
}): {
  token: string;
  refreshToken: string;
  sessionTokenId: string;
  userRecord: Record<string, unknown>;
} {
  const missing: string[] = [];
  if (!fields.token) missing.push("token");
  if (!fields.refreshToken) missing.push("refresh_token (or refreshToken)");
  if (!fields.sessionTokenId)
    missing.push("session_token_id (or sessionTokenId)");
  if (!fields.userRecord) missing.push("user");

  if (missing.length) {
    throw new Error(
      `Unexpected auth response: missing required field(s): ${missing.join(", ")}`,
    );
  }

  return {
    token: fields.token!,
    refreshToken: fields.refreshToken!,
    sessionTokenId: fields.sessionTokenId!,
    userRecord: fields.userRecord!,
  };
}

export const normalizeAuthResponse = (raw: unknown): LoginPayload => {
  const record = (asRecord(raw) ?? {}) as AuthApiResponse;
  const sessionRecord = asRecord(record.session);
  const authRecord = asRecord(record.auth);

  const candidates: AuthApiResponse[] = [
    record,
    sessionRecord ?? {},
    authRecord ?? {},
  ];

  const pick = (key: string): unknown => {
    for (const candidate of candidates) {
      if (key in candidate) return candidate[key];
    }
    return undefined;
  };

  const userRecord = (() => {
    for (const candidate of candidates) {
      const user = candidate.user;
      if (user && typeof user === "object") {
        return user as Record<string, unknown>;
      }
    }
    return null;
  })();

  const token = readString(pick("token"));
  const refreshToken = readString(
    pick("refresh_token") ?? pick("refreshToken"),
  );
  const sessionTokenId = readSessionTokenId(
    pick("session_token_id") ?? pick("sessionTokenId"),
  );

  const required = requireAuthFields({
    token,
    refreshToken,
    sessionTokenId,
    userRecord,
  });

  // Prefer role flags on `user`, but tolerate them at the top-level and merge in.
  const mergedUserRecord = {
    ...required.userRecord,
    is_admin:
      required.userRecord.is_admin ??
      required.userRecord.isAdmin ??
      pick("is_admin") ??
      pick("isAdmin"),
    is_superuser:
      required.userRecord.is_superuser ??
      required.userRecord.isSuperuser ??
      pick("is_superuser") ??
      pick("isSuperuser"),
  };

  const user = normalizeUser(mergedUserRecord);

  return {
    token: required.token,
    refreshToken: required.refreshToken,
    sessionTokenId: required.sessionTokenId,
    user,
  };
};
