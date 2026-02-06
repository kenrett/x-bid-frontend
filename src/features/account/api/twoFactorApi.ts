import client from "@api/client";
import type { components } from "@api/openapi-types";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";

export const TWO_FACTOR_ENDPOINTS = {
  status: "/api/v1/account/2fa",
  setup: "/api/v1/account/2fa/setup",
  verify: "/api/v1/account/2fa/verify",
  disable: "/api/v1/account/2fa/disable",
} as const;

export type TwoFactorStatus = {
  enabled: boolean;
  enabledAt?: string | null;
};

export type TwoFactorSetup = {
  secret: string;
  otpauthUrl?: string | null;
  qrCodeSvg?: string | null;
  issuer?: string | null;
  accountName?: string | null;
};

export type TwoFactorRecoveryCodes = {
  recoveryCodes: string[];
};

type OpenApiTwoFactorSetup =
  components["schemas"]["AccountTwoFactorSetupResponse"];
type OpenApiTwoFactorVerify =
  components["schemas"]["AccountTwoFactorVerifyResponse"];

type OpenApiTwoFactorStatus = {
  enabled?: unknown;
  enabled_at?: unknown;
  enabledAt?: unknown;
  is_enabled?: unknown;
  active?: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readStringArray = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as string[])
    : null;

const normalizeStatus = (payload: unknown): TwoFactorStatus => {
  const record = asRecord(payload);
  if (!record) throw reportUnexpectedResponse("two_factor.status", payload);

  const enabled =
    readBoolean((record as OpenApiTwoFactorStatus).enabled) ??
    readBoolean((record as OpenApiTwoFactorStatus).is_enabled) ??
    readBoolean((record as OpenApiTwoFactorStatus).active) ??
    false;

  const enabledAt =
    readString((record as OpenApiTwoFactorStatus).enabled_at) ??
    readString((record as OpenApiTwoFactorStatus).enabledAt) ??
    null;

  return { enabled, enabledAt };
};

const normalizeSetup = (payload: unknown): TwoFactorSetup => {
  const record = asRecord(payload);
  if (!record) throw reportUnexpectedResponse("two_factor.setup", payload);

  const secret =
    readString(record.secret) ??
    readString(record.otp_secret) ??
    readString(record.totp_secret) ??
    readString((record as OpenApiTwoFactorSetup).secret) ??
    null;

  if (!secret)
    throw reportUnexpectedResponse("two_factor.setup.secret", payload);

  const otpauthUrl =
    readString(record.otpauth_uri) ??
    readString(record.otpauth_url) ??
    readString(record.otpauthUrl) ??
    readString(record.qr_url) ??
    readString((record as OpenApiTwoFactorSetup).otpauth_uri) ??
    null;

  const qrCodeSvg =
    readString(record.qr_svg) ??
    readString(record.qrCodeSvg) ??
    readString(record.qr_svg_markup) ??
    null;

  return {
    secret,
    otpauthUrl,
    qrCodeSvg,
    issuer: readString(record.issuer),
    accountName:
      readString(record.account_name) ?? readString(record.accountName),
  };
};

const normalizeRecoveryCodes = (payload: unknown): TwoFactorRecoveryCodes => {
  const record = asRecord(payload);
  if (!record) throw reportUnexpectedResponse("two_factor.recovery", payload);

  const codes =
    readStringArray(record.recovery_codes) ??
    readStringArray((record as OpenApiTwoFactorVerify).recovery_codes) ??
    readStringArray(record.recoveryCodes) ??
    [];

  return { recoveryCodes: codes };
};

export const twoFactorApi = {
  async getStatus(): Promise<TwoFactorStatus> {
    const response = await client.get(TWO_FACTOR_ENDPOINTS.status);
    return normalizeStatus(response.data);
  },
  async startSetup(): Promise<TwoFactorSetup> {
    const response = await client.post(TWO_FACTOR_ENDPOINTS.setup, {});
    return normalizeSetup(response.data);
  },
  async verifySetup(code: string): Promise<TwoFactorRecoveryCodes> {
    const response = await client.post(TWO_FACTOR_ENDPOINTS.verify, {
      code,
    });
    return normalizeRecoveryCodes(response.data);
  },
};
