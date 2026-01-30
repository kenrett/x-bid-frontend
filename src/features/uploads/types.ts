export type UploadStatus =
  | "idle"
  | "validating"
  | "uploading"
  | "success"
  | "error";

export type UploadErrorCode =
  | "invalid_type"
  | "file_too_large"
  | "invalid_dimensions"
  | "payload_too_large"
  | "auth_required"
  | "forbidden"
  | "network"
  | "server"
  | "unknown";

export type UploadError = {
  code: UploadErrorCode;
  message: string;
  retryable: boolean;
  status?: number;
};

export type UploadResult = {
  url: string;
  fileName?: string;
  byteSize?: number;
  contentType?: string;
};

export type UploadAdapter = {
  upload: (params: {
    file: File;
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  }) => Promise<UploadResult>;
};

export type ImageDimensionConstraints = {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
};

export type UploadConstraints = {
  accept: string[];
  maxBytes: number;
  imageDimensions?: ImageDimensionConstraints;
  guidance?: string;
};
