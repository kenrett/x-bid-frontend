import { createContext, type ReactNode } from "react";
import type { UploadAdapter } from "./types";

const UploadContext = createContext<UploadAdapter | null>(null);

export const UploadProvider = ({
  adapter,
  children,
}: {
  adapter: UploadAdapter;
  children: ReactNode;
}) => {
  return (
    <UploadContext.Provider value={adapter}>{children}</UploadContext.Provider>
  );
};
export { UploadContext };
