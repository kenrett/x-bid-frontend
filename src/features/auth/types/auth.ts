import type { User } from "./user";

export type LoginPayload = {
  token: string;
  refreshToken: string;
  sessionTokenId: string;
  user: User;
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
  updateUser: (updater: (current: User) => User) => void;
  updateUserBalance: (newBalance: number) => void;
};
