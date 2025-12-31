export type AccountProfile = {
  name: string;
  email: string;
  createdAt?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
};

export type AccountSecurityStatus = {
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
};

export type AccountSession = {
  id: string;
  deviceLabel: string;
  ip?: string;
  createdAt?: string;
  lastSeenAt?: string;
  isCurrent: boolean;
};

export type NotificationPreferences = {
  marketing_emails: boolean;
  product_updates: boolean;
  bidding_alerts: boolean;
  outbid_alerts: boolean;
  watched_auction_ending: boolean;
  receipts: boolean;
};

export type DataExportStatus = {
  status: "not_requested" | "pending" | "ready" | "failed";
  downloadUrl?: string;
  requestedAt?: string;
  readyAt?: string;
};
