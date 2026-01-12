import type { User } from "./user";

export type LoginPayload = {
  user: User;
};

export type AuthContextType = {
  user: User | null;
  sessionRemainingSeconds: number | null;
  isReady: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
  updateUser: (updater: (current: User) => User) => void;
  updateUserBalance: (newBalance: number) => void;
};
