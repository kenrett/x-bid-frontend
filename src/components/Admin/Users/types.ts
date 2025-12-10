export type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "superadmin" | "user";
  status: "active" | "disabled";
};

export type Payment = {
  id: number;
  userEmail: string;
  amount: number;
  status: "succeeded" | "failed" | "pending";
  createdAt: string;
};
