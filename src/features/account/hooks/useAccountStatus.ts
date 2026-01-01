import { useContext } from "react";
import { AccountStatusContext } from "../contexts/accountStatusContext";

export const useAccountStatus = () => {
  const ctx = useContext(AccountStatusContext);
  if (!ctx) {
    throw new Error(
      "useAccountStatus must be used within an AccountStatusProvider",
    );
  }
  return ctx;
};
