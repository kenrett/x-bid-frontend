import type { LoginPayload } from "../types/auth";
import type { User } from "../types/user";
import { normalizeUser } from "./user";

type AuthApiResponse = Record<string, unknown>;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

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

  if (!token || !refreshToken || !sessionTokenId) {
    throw new Error("Unexpected auth response: missing token fields");
  }
  if (!userRecord) {
    throw new Error("Unexpected auth response: missing user");
  }

  // Prefer role flags on `user`, but tolerate them at the top-level and merge in.
  const mergedUserRecord = {
    ...userRecord,
    is_admin: userRecord.is_admin ?? record.is_admin,
    is_superuser: userRecord.is_superuser ?? record.is_superuser,
  };

  const user = normalizeUser(mergedUserRecord as unknown as User);

  return {
    token,
    refreshToken,
    sessionTokenId,
    user,
  };
};
