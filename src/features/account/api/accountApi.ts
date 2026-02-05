import client from "@api/client";
import axios from "axios";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";
import type {
  AccountProfile,
  AccountSecurityStatus,
  AccountSession,
  DataExportStatus,
  NotificationPreferences,
} from "../types/account";

export const ACCOUNT_ENDPOINTS = {
  profile: "/api/v1/account",
  profileName: "/api/v1/account",
  emailChange: "/api/v1/account/email-change",
  security: "/api/v1/account/security",
  password: "/api/v1/account/password",
  resendEmailVerification: "/api/v1/email_verifications/resend",
  verifyEmail: "/api/v1/email_verifications/verify",
  sessions: "/api/v1/account/sessions",
  revokeOtherSessions: "/api/v1/account/sessions/revoke_others",
  notifications: "/api/v1/account/notifications",
  dataExport: "/api/v1/account/data/export",
  account: "/api/v1/account",
} as const;

const isJsonContentType = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  return value.toLowerCase().includes("application/json");
};

const toSnippet = (value: unknown): string => {
  if (typeof value === "string")
    return value.replace(/\s+/g, " ").slice(0, 180);
  try {
    return JSON.stringify(value).slice(0, 180);
  } catch {
    return String(value).slice(0, 180);
  }
};

const requestAccountApi = async <T>(
  method: string,
  path: string,
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const headers = error.response.headers as
        | Record<string, unknown>
        | undefined;
      const contentType =
        headers?.["content-type"] ?? headers?.["Content-Type"];
      if (!isJsonContentType(contentType)) {
        const snippet = toSnippet(error.response.data);
        throw new Error(
          `[Account API] ${method.toUpperCase()} ${path} failed (${status}): ${snippet}`,
        );
      }
    }
    throw error;
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const readIdString = (value: unknown): string | undefined => {
  if (typeof value === "string") return readString(value) ?? undefined;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return String(value);
  return undefined;
};

const readBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const readBooleanLike = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "t", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "f", "0", "no", "n"].includes(normalized)) return false;
  }
  return undefined;
};

const normalizeProfile = (payload: unknown): AccountProfile => {
  const record = asRecord(payload) ?? {};

  const containers = [
    record,
    asRecord(record.profile),
    asRecord(record.account),
    asRecord(record.me),
    asRecord(record.data),
  ].filter(Boolean) as Record<string, unknown>[];

  const userCandidates = [
    ...containers.map((container) => asRecord(container.user)),
    ...containers,
  ].filter(Boolean) as Record<string, unknown>[];

  const readFromCandidates = (
    accessor: (candidate: Record<string, unknown>) => string | undefined,
  ) => {
    for (const candidate of userCandidates) {
      const value = accessor(candidate);
      if (value) return value;
    }
    return undefined;
  };

  const readBoolFromCandidates = (
    accessor: (candidate: Record<string, unknown>) => boolean | undefined,
  ) => {
    for (const candidate of userCandidates) {
      const value = accessor(candidate);
      if (typeof value === "boolean") return value;
    }
    return undefined;
  };

  const name =
    readFromCandidates((candidate) => readString(candidate.name)) ?? "";
  const email =
    readFromCandidates((candidate) => readString(candidate.email)) ??
    readFromCandidates((candidate) => readString(candidate.email_address)) ??
    readFromCandidates((candidate) => readString(candidate.emailAddress)) ??
    "";

  if (!email) {
    throw reportUnexpectedResponse("account.profile.email", payload);
  }

  const createdAt =
    readString(record.created_at) ??
    readString(record.createdAt) ??
    readFromCandidates((candidate) => readString(candidate.created_at)) ??
    readFromCandidates((candidate) => readString(candidate.createdAt));

  const emailVerified =
    readBooleanLike(record.email_verified) ??
    readBooleanLike(record.emailVerified) ??
    readBoolFromCandidates(
      (candidate) =>
        readBooleanLike(candidate.email_verified) ??
        readBooleanLike(candidate.emailVerified),
    );

  const emailVerifiedAt =
    readString(record.email_verified_at) ??
    readString(record.emailVerifiedAt) ??
    readFromCandidates((candidate) =>
      readString(candidate.email_verified_at),
    ) ??
    readFromCandidates((candidate) => readString(candidate.emailVerifiedAt)) ??
    null;

  return {
    name,
    email,
    createdAt,
    emailVerified: emailVerified ?? Boolean(emailVerifiedAt),
    emailVerifiedAt,
  };
};

const normalizeSecurity = (payload: unknown): AccountSecurityStatus => {
  const record = asRecord(payload) ?? {};

  const containers = [
    record,
    asRecord(record.security),
    asRecord(record.account),
    asRecord(record.user),
    asRecord(record.me),
    asRecord(record.data),
    asRecord(asRecord(record.data)?.security),
    asRecord(asRecord(record.data)?.account),
    asRecord(asRecord(record.data)?.user),
  ].filter(Boolean) as Record<string, unknown>[];

  const readFromCandidates = (
    accessor: (candidate: Record<string, unknown>) => string | undefined,
  ) => {
    for (const candidate of containers) {
      const value = accessor(candidate);
      if (value) return value;
    }
    return undefined;
  };

  const readBoolFromCandidates = (
    accessor: (candidate: Record<string, unknown>) => boolean | undefined,
  ) => {
    for (const candidate of containers) {
      const value = accessor(candidate);
      if (typeof value === "boolean") return value;
    }
    return undefined;
  };

  const emailVerifiedAt =
    readString(record.email_verified_at) ??
    readString(record.emailVerifiedAt) ??
    readFromCandidates((candidate) =>
      readString(candidate.email_verified_at),
    ) ??
    readFromCandidates((candidate) => readString(candidate.emailVerifiedAt)) ??
    null;

  const emailVerified =
    readBooleanLike(record.email_verified) ??
    readBooleanLike(record.emailVerified) ??
    readBoolFromCandidates(
      (candidate) =>
        readBooleanLike(candidate.email_verified) ??
        readBooleanLike(candidate.emailVerified),
    ) ??
    Boolean(emailVerifiedAt);

  return { emailVerified, emailVerifiedAt: emailVerifiedAt ?? null };
};

const normalizeSessions = (payload: unknown): AccountSession[] => {
  const record = asRecord(payload) ?? {};
  const list = Array.isArray(record.sessions)
    ? (record.sessions as unknown[])
    : Array.isArray(payload)
      ? (payload as unknown[])
      : null;

  if (!list) {
    throw reportUnexpectedResponse("account.sessions.list", payload);
  }

  return list.map((item) => {
    const s = asRecord(item) ?? {};
    const id = readIdString(s.id) ?? readIdString(s.session_id) ?? "";
    if (!id) throw reportUnexpectedResponse("account.sessions.id", item);

    const deviceLabel =
      readString(s.device_label) ??
      readString(s.deviceLabel) ??
      readString(s.user_agent) ??
      "Session";

    const isCurrent =
      readBoolean(s.current_session) ??
      readBoolean(s.isCurrent) ??
      readBoolean(s.current) ??
      false;

    return {
      id,
      deviceLabel,
      ip:
        readString(s.ip) ?? readString(s.ip_address) ?? readString(s.ipAddress),
      createdAt: readString(s.created_at) ?? readString(s.createdAt),
      lastSeenAt: readString(s.last_seen_at) ?? readString(s.lastSeenAt),
      isCurrent,
    };
  });
};

const defaultNotificationPreferences = (): NotificationPreferences => ({
  marketing_emails: false,
  product_updates: false,
  bidding_alerts: true,
  outbid_alerts: true,
  watched_auction_ending: true,
  receipts: true,
});

const normalizeNotifications = (payload: unknown): NotificationPreferences => {
  const record = asRecord(payload) ?? {};
  const prefsRecord =
    asRecord(record.preferences) ?? asRecord(record.notifications) ?? record;

  const defaults = defaultNotificationPreferences();
  const readPref = (key: keyof NotificationPreferences): boolean =>
    readBoolean(prefsRecord[key]) ?? defaults[key];

  return {
    marketing_emails: readPref("marketing_emails"),
    product_updates: readPref("product_updates"),
    bidding_alerts: readPref("bidding_alerts"),
    outbid_alerts: readPref("outbid_alerts"),
    watched_auction_ending: readPref("watched_auction_ending"),
    receipts: readPref("receipts"),
  };
};

const normalizeExportStatus = (payload: unknown): DataExportStatus => {
  const record = asRecord(payload) ?? {};
  const exportRecord = asRecord(record.export) ?? record;
  const rawStatus =
    readString(exportRecord.status) ??
    readString(exportRecord.state) ??
    "not_requested";

  const status =
    rawStatus === "pending" ||
    rawStatus === "ready" ||
    rawStatus === "failed" ||
    rawStatus === "not_requested"
      ? rawStatus
      : "pending";

  return {
    status,
    downloadUrl:
      readString(exportRecord.download_url) ??
      readString(exportRecord.downloadUrl),
    requestedAt:
      readString(exportRecord.requested_at) ??
      readString(exportRecord.requestedAt),
    readyAt:
      readString(exportRecord.ready_at) ?? readString(exportRecord.readyAt),
  };
};

export const accountApi = {
  async getProfile(): Promise<AccountProfile> {
    const response = await requestAccountApi(
      "GET",
      ACCOUNT_ENDPOINTS.profile,
      () => client.get(ACCOUNT_ENDPOINTS.profile),
    );
    return normalizeProfile(response.data);
  },

  async updateName(name: string): Promise<AccountProfile> {
    const response = await requestAccountApi(
      "PATCH",
      ACCOUNT_ENDPOINTS.profileName,
      () =>
        client.patch(ACCOUNT_ENDPOINTS.profileName, {
          account: { name },
        }),
    );
    return normalizeProfile(response.data);
  },

  async requestEmailChange(payload: {
    new_email_address: string;
    current_password?: string;
  }): Promise<{ status: "verification_sent" }> {
    const response = await requestAccountApi(
      "POST",
      ACCOUNT_ENDPOINTS.emailChange,
      () => client.post(ACCOUNT_ENDPOINTS.emailChange, payload),
    );
    const record = asRecord(response.data) ?? {};
    const status =
      readString(record.status) ??
      readString(record.state) ??
      "verification_sent";
    return {
      status: status === "verification_sent" ? status : "verification_sent",
    };
  },

  async getSecurity(): Promise<AccountSecurityStatus> {
    const response = await requestAccountApi(
      "GET",
      ACCOUNT_ENDPOINTS.security,
      () => client.get(ACCOUNT_ENDPOINTS.security),
    );
    return normalizeSecurity(response.data);
  },

  async changePassword(payload: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    await requestAccountApi("POST", ACCOUNT_ENDPOINTS.password, () =>
      client.post(ACCOUNT_ENDPOINTS.password, payload),
    );
  },

  async resendEmailVerification(): Promise<void> {
    await requestAccountApi(
      "POST",
      ACCOUNT_ENDPOINTS.resendEmailVerification,
      () => client.post(ACCOUNT_ENDPOINTS.resendEmailVerification, {}),
    );
  },

  async verifyEmail(
    token: string,
  ): Promise<{ status: "verified" | "already_verified" }> {
    const response = await requestAccountApi(
      "GET",
      ACCOUNT_ENDPOINTS.verifyEmail,
      () => client.get(ACCOUNT_ENDPOINTS.verifyEmail, { params: { token } }),
    );
    const record = asRecord(response.data) ?? {};
    const status = readString(record.status) ?? "verified";
    return {
      status: status === "already_verified" ? "already_verified" : "verified",
    };
  },

  async listSessions(): Promise<AccountSession[]> {
    const response = await requestAccountApi(
      "GET",
      ACCOUNT_ENDPOINTS.sessions,
      () => client.get(ACCOUNT_ENDPOINTS.sessions),
    );
    const status = response.status;
    if (typeof status === "number" && (status < 200 || status >= 300)) {
      throw new Error(
        `[Account API] GET ${ACCOUNT_ENDPOINTS.sessions} failed (${status}): ${toSnippet(response.data)}`,
      );
    }

    const headers = response.headers as Record<string, unknown> | undefined;
    const contentType = headers?.["content-type"] ?? headers?.["Content-Type"];
    if (typeof contentType === "string" && !isJsonContentType(contentType)) {
      throw new Error(
        `[Account API] GET ${ACCOUNT_ENDPOINTS.sessions} returned non-JSON response (${String(status ?? "unknown")}): ${toSnippet(response.data)}`,
      );
    }
    if (typeof contentType !== "string" && typeof response.data === "string") {
      throw new Error(
        `[Account API] GET ${ACCOUNT_ENDPOINTS.sessions} returned non-JSON response (${String(status ?? "unknown")}): ${toSnippet(response.data)}`,
      );
    }
    return normalizeSessions(response.data);
  },

  async revokeSession(sessionId: string): Promise<void> {
    const path = `${ACCOUNT_ENDPOINTS.sessions}/${encodeURIComponent(sessionId)}`;
    await requestAccountApi("DELETE", path, () => client.delete(path));
  },

  async revokeOtherSessions(): Promise<void> {
    await requestAccountApi("POST", ACCOUNT_ENDPOINTS.revokeOtherSessions, () =>
      client.post(ACCOUNT_ENDPOINTS.revokeOtherSessions, {}),
    );
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await requestAccountApi(
      "GET",
      ACCOUNT_ENDPOINTS.notifications,
      () => client.get(ACCOUNT_ENDPOINTS.notifications),
    );
    return normalizeNotifications(response.data);
  },

  async updateNotificationPreferences(
    prefs: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    const response = await requestAccountApi(
      "PUT",
      ACCOUNT_ENDPOINTS.notifications,
      () =>
        client.put(ACCOUNT_ENDPOINTS.notifications, {
          account: { notification_preferences: prefs },
        }),
    );
    return normalizeNotifications(response.data);
  },

  async getExportStatus(): Promise<DataExportStatus> {
    const response = await requestAccountApi(
      "GET",
      ACCOUNT_ENDPOINTS.dataExport,
      () => client.get(ACCOUNT_ENDPOINTS.dataExport),
    );
    return normalizeExportStatus(response.data);
  },

  async requestExport(): Promise<DataExportStatus> {
    const response = await requestAccountApi(
      "POST",
      ACCOUNT_ENDPOINTS.dataExport,
      () => client.post(ACCOUNT_ENDPOINTS.dataExport, {}),
    );
    return normalizeExportStatus(response.data);
  },

  async deleteAccount(payload: {
    current_password: string;
    confirmation: string;
  }): Promise<void> {
    await requestAccountApi("DELETE", ACCOUNT_ENDPOINTS.account, () =>
      client.delete(ACCOUNT_ENDPOINTS.account, { data: payload }),
    );
  },
};
