import type { LoginPayload } from "../types/auth";
import { normalizeUser } from "./user";

type AuthApiResponse = Record<string, unknown>;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

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
  const record = (raw ?? {}) as AuthApiResponse;
  const userRecord =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;

  const token = readString(record.token);
  const refreshToken = readString(record.refresh_token ?? record.refreshToken);
  const sessionTokenId = readString(
    record.session_token_id ?? record.sessionTokenId,
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
      record.is_admin ??
      record.isAdmin,
    is_superuser:
      required.userRecord.is_superuser ??
      required.userRecord.isSuperuser ??
      record.is_superuser ??
      record.isSuperuser,
  };

  const user = normalizeUser(mergedUserRecord);

  return {
    token: required.token,
    refreshToken: required.refreshToken,
    sessionTokenId: required.sessionTokenId,
    user,
  };
};
