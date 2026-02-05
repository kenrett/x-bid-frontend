type CspEnv = "development" | "production" | "test";
type CspOptions = {
  env: CspEnv;
  apiBaseUrl?: string;
  cableUrl?: string;
};
export declare const getCsp: ({
  env,
  apiBaseUrl,
  cableUrl,
}: CspOptions) => string;
export {};
