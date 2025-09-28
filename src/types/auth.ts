import type { User } from './user';

export type AuthContextType = {
  user: User | null;
  currentUser: User | null;
  isLoggedIn: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};