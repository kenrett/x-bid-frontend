import { useMemo } from "react";
import { getStorefrontKey, STOREFRONT_CONFIGS } from "./storefront";

export const useStorefront = () => {
  return useMemo(() => {
    const key = getStorefrontKey();
    const config = STOREFRONT_CONFIGS[key] ?? STOREFRONT_CONFIGS.main;
    return { key, config };
  }, []);
};
