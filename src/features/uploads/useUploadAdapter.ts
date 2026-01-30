import { useContext } from "react";
import type { UploadAdapter } from "./types";
import { UploadContext } from "./UploadProvider";

export const useUploadAdapter = (fallback?: UploadAdapter) => {
  const context = useContext(UploadContext);
  return context ?? fallback ?? null;
};
