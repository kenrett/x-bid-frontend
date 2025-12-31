import client from "@api/client";
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
  resendVerification: "/api/v1/account/email/verification/resend",
  sessions: "/api/v1/account/sessions",
  revokeOtherSessions: "/api/v1/account/sessions/revoke-others",
  notifications: "/api/v1/account/notifications",
  dataExport: "/api/v1/account/data/export",
  account: "/api/v1/account",
} as const;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const readBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

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
    readBoolean(record.email_verified) ??
    readBoolean(record.emailVerified) ??
    readBoolFromCandidates(
      (candidate) =>
        readBoolean(candidate.email_verified) ??
        readBoolean(candidate.emailVerified),
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
    emailVerified,
    emailVerifiedAt,
  };
};

const normalizeSecurity = (payload: unknown): AccountSecurityStatus => {
  const record = asRecord(payload) ?? {};
  const emailVerified =
    readBoolean(record.email_verified) ??
    readBoolean(record.emailVerified) ??
    false;
  const emailVerifiedAt =
    readString(record.email_verified_at) ?? readString(record.emailVerifiedAt);
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
    const id = readString(s.id) ?? readString(s.session_id) ?? "";
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
    const response = await client.get(ACCOUNT_ENDPOINTS.profile);
    return normalizeProfile(response.data);
  },

  async updateName(name: string): Promise<AccountProfile> {
    const response = await client.patch(ACCOUNT_ENDPOINTS.profileName, {
      name,
    });
    return normalizeProfile(response.data);
  },

  async requestEmailChange(payload: {
    email: string;
    current_password?: string;
  }): Promise<{ status: "verification_sent" }> {
    const response = await client.post(ACCOUNT_ENDPOINTS.emailChange, payload);
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
    const response = await client.get(ACCOUNT_ENDPOINTS.security);
    return normalizeSecurity(response.data);
  },

  async changePassword(payload: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    await client.post(ACCOUNT_ENDPOINTS.password, payload);
  },

  async resendVerificationEmail(): Promise<void> {
    await client.post(ACCOUNT_ENDPOINTS.resendVerification, {});
  },

  async listSessions(): Promise<AccountSession[]> {
    const response = await client.get(ACCOUNT_ENDPOINTS.sessions);
    return normalizeSessions(response.data);
  },

  async revokeSession(sessionId: string): Promise<void> {
    await client.delete(
      `${ACCOUNT_ENDPOINTS.sessions}/${encodeURIComponent(sessionId)}`,
    );
  },

  async revokeOtherSessions(): Promise<void> {
    await client.post(ACCOUNT_ENDPOINTS.revokeOtherSessions, {});
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await client.get(ACCOUNT_ENDPOINTS.notifications);
    return normalizeNotifications(response.data);
  },

  async updateNotificationPreferences(
    prefs: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    const response = await client.put(ACCOUNT_ENDPOINTS.notifications, prefs);
    return normalizeNotifications(response.data);
  },

  async getExportStatus(): Promise<DataExportStatus> {
    const response = await client.get(ACCOUNT_ENDPOINTS.dataExport);
    return normalizeExportStatus(response.data);
  },

  async requestExport(): Promise<DataExportStatus> {
    const response = await client.post(ACCOUNT_ENDPOINTS.dataExport, {});
    return normalizeExportStatus(response.data);
  },

  async deleteAccount(payload: { confirmation: string }): Promise<void> {
    await client.delete(ACCOUNT_ENDPOINTS.account, { data: payload });
  },
};
