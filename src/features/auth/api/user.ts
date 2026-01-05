import type { User } from "../types/user";
import type { ApiJsonResponse } from "@api/openapi-helpers";

const coerceAdminFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string")
    return ["true", "1", "t", "yes"].includes(value.toLowerCase());
  return false;
};

type LoginResponse = ApiJsonResponse<"/api/v1/login", "post">;
type SignupResponse = ApiJsonResponse<"/api/v1/signup", "post">;
type UserPayload =
  | LoginResponse
  | SignupResponse
  | (LoginResponse extends { user: infer U } ? U : never)
  | (SignupResponse extends { user: infer U } ? U : never)
  | Record<string, unknown>;

export const normalizeUser = (apiUser: UserPayload): User => {
  const record = (apiUser ?? {}) as Record<string, unknown>;
  const email =
    record.email ?? record.email_address ?? record.emailAddress ?? "";

  const hasAdminRole = (() => {
    const role = record.role;
    const roles = record.roles;
    if (typeof role === "string") return role.toLowerCase() === "admin";
    if (Array.isArray(roles)) {
      return roles.some(
        (r) => typeof r === "string" && r.toLowerCase() === "admin",
      );
    }
    return false;
  })();

  const hasSuperRole = (() => {
    const role = record.role;
    const roles = record.roles;
    if (typeof role === "string") return role.toLowerCase() === "superadmin";
    if (Array.isArray(roles)) {
      return roles.some(
        (r) => typeof r === "string" && r.toLowerCase() === "superadmin",
      );
    }
    return false;
  })();

  const isSuperuser =
    coerceAdminFlag(
      record.is_superuser ??
        record.isSuperuser ??
        record.superuser ??
        record.super_admin ??
        record.superAdmin,
    ) || hasSuperRole;

  const isAdmin =
    coerceAdminFlag(record.is_admin ?? record.isAdmin ?? record.admin) ||
    hasAdminRole ||
    isSuperuser;

  const normalizedName = typeof record.name === "string" ? record.name : "";
  const normalizedEmail = typeof email === "string" ? email : "";

  const emailVerifiedAt = (() => {
    const raw =
      record.email_verified_at ??
      record.emailVerifiedAt ??
      record.email_verifiedAt ??
      null;
    return typeof raw === "string" && raw.trim() ? raw : null;
  })();

  const emailVerifiedRaw =
    record.email_verified ?? record.emailVerified ?? undefined;
  const emailVerified =
    typeof emailVerifiedRaw === "undefined"
      ? emailVerifiedAt
        ? true
        : null
      : coerceAdminFlag(emailVerifiedRaw) || Boolean(emailVerifiedAt);

  return {
    id: Number(record.id ?? 0),
    name: normalizedName,
    email: normalizedEmail,
    bidCredits: Number(
      record.bidCredits ??
        record.bid_credits ??
        record.bid_credits_balance ??
        0,
    ),
    is_admin: isAdmin,
    is_superuser: isSuperuser,
    email_verified: emailVerified,
    email_verified_at: emailVerifiedAt,
  };
};
