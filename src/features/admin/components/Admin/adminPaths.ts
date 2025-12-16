export const ADMIN_PATHS = {
  auctions: "auctions",
  bidPacks: "bid-packs",
  users: "users",
  payments: "payments",
  settings: "settings",
} as const;

export type AdminPathKey = keyof typeof ADMIN_PATHS;
