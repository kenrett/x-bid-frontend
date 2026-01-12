import type { User } from "./user";

export type LoginPayload = {
  accessToken?: string | null;
  refreshToken?: string | null;
  user: User;
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  sessionRemainingSeconds: number | null;
  isReady: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
  updateUser: (updater: (current: User) => User) => void;
  updateUserBalance: (newBalance: number) => void;
};
