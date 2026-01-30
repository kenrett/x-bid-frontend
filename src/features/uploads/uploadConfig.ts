import { createMultipartUploadAdapter } from "./api/multipartUploadAdapter";
import type { UploadAdapter } from "./types";

const DEFAULT_ENDPOINT = "/api/v1/uploads";

export const defaultUploadAdapter: UploadAdapter = createMultipartUploadAdapter(
  { endpoint: DEFAULT_ENDPOINT },
);
