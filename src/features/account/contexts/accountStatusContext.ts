import { createContext } from "react";

export type AccountSecurityStatusState = {
  isLoading: boolean;
  error: string | null;
  emailVerified: boolean | null;
  emailVerifiedAt: string | null;
  refresh: () => Promise<void>;
};

const noopRefresh = async () => {};

export const AccountStatusContext = createContext<AccountSecurityStatusState>({
  isLoading: false,
  error: null,
  emailVerified: null,
  emailVerifiedAt: null,
  refresh: noopRefresh,
});
