import type { User } from "./user";

export type LoginPayload = {
  token: string;
  refreshToken: string;
  sessionTokenId: string;
  user: User;
  is_admin?: boolean;
  is_superuser?: boolean;
};

export type AuthContextType = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  sessionTokenId: string | null;
  sessionRemainingSeconds: number | null;
  isReady: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
};
