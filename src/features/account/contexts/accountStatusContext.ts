import { createContext } from "react";

export type AccountSecurityStatusState = {
  isLoading: boolean;
  error: string | null;
  emailVerified: boolean | null;
  emailVerifiedAt: string | null;
  refresh: () => Promise<void>;
};

export const AccountStatusContext =
  createContext<AccountSecurityStatusState | null>(null);
