import { useContext } from "react";
import { AccountStatusContext } from "../contexts/accountStatusContext";

export const useAccountStatus = () => {
  return useContext(AccountStatusContext);
};
