export interface User {
  bidCredits: number;
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_superuser?: boolean;
  email_verified: boolean | null;
  email_verified_at: string | null;
}
