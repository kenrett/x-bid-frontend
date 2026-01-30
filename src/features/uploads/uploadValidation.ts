import type {
  ImageDimensionConstraints,
  UploadConstraints,
  UploadError,
} from "./types";

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const isAllowedMime = (mime: string, accept: string[]) => {
  if (!mime) return false;
  return accept.some((entry) => {
    const normalized = entry.trim();
    if (!normalized) return false;
    if (normalized.endsWith("/*")) {
      return mime.startsWith(normalized.replace("/*", "/"));
    }
    return mime === normalized;
  });
};

const buildDimensionMessage = (constraints: ImageDimensionConstraints) => {
  const parts: string[] = [];
  if (constraints.minWidth || constraints.minHeight) {
    parts.push(
      `minimum ${constraints.minWidth ?? "?"}x${constraints.minHeight ?? "?"}`,
    );
  }
  if (constraints.maxWidth || constraints.maxHeight) {
    parts.push(
      `maximum ${constraints.maxWidth ?? "?"}x${constraints.maxHeight ?? "?"}`,
    );
  }
  return parts.length ? `Image must be ${parts.join(" and ")}.` : undefined;
};

const readImageDimensions = (
  file: File,
): Promise<{
  width: number;
  height: number;
} | null> => {
  if (typeof Image === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      cleanup();
      resolve({ width, height });
    };

    img.onerror = () => {
      cleanup();
      resolve(null);
    };

    img.src = url;
  });
};

const validateDimensions = async (
  file: File,
  constraints: ImageDimensionConstraints,
): Promise<UploadError | null> => {
  const dimensions = await readImageDimensions(file);
  if (!dimensions) return null;

  const { width, height } = dimensions;
  if (constraints.minWidth && width < constraints.minWidth) {
    return {
      code: "invalid_dimensions",
      message:
        buildDimensionMessage(constraints) ?? "Image dimensions are too small.",
      retryable: false,
    };
  }
  if (constraints.minHeight && height < constraints.minHeight) {
    return {
      code: "invalid_dimensions",
      message:
        buildDimensionMessage(constraints) ?? "Image dimensions are too small.",
      retryable: false,
    };
  }
  if (constraints.maxWidth && width > constraints.maxWidth) {
    return {
      code: "invalid_dimensions",
      message:
        buildDimensionMessage(constraints) ?? "Image dimensions are too large.",
      retryable: false,
    };
  }
  if (constraints.maxHeight && height > constraints.maxHeight) {
    return {
      code: "invalid_dimensions",
      message:
        buildDimensionMessage(constraints) ?? "Image dimensions are too large.",
      retryable: false,
    };
  }

  return null;
};

export const validateUploadFile = async (
  file: File,
  constraints: UploadConstraints,
): Promise<UploadError | null> => {
  if (!isAllowedMime(file.type, constraints.accept)) {
    return {
      code: "invalid_type",
      message: `Unsupported file type. Allowed: ${constraints.accept.join(", ")}.`,
      retryable: false,
    };
  }

  if (file.size > constraints.maxBytes) {
    return {
      code: "file_too_large",
      message: `File is too large. Max size is ${formatBytes(
        constraints.maxBytes,
      )}.`,
      retryable: false,
    };
  }

  if (constraints.imageDimensions && file.type.startsWith("image/")) {
    return validateDimensions(file, constraints.imageDimensions);
  }

  return null;
};
