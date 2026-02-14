import { describe, expect, it } from "vitest";
import { normalizeUploadAssetUrl } from "./uploadAssetUrl";

const DEFAULT_API_ORIGIN = "https://api.biddersweet.app";

const getExpectedApiOrigin = () => {
  const rawApiBase =
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : "";

  if (!rawApiBase || rawApiBase === "undefined" || rawApiBase === "null") {
    return DEFAULT_API_ORIGIN;
  }

  try {
    return new URL(rawApiBase).origin;
  } catch {
    return DEFAULT_API_ORIGIN;
  }
};

describe("normalizeUploadAssetUrl", () => {
  it("keeps absolute API upload URLs unchanged", () => {
    expect(
      normalizeUploadAssetUrl(
        "https://api.biddersweet.app/api/v1/uploads/signed-123?disposition=inline",
      ),
    ).toBe(
      "https://api.biddersweet.app/api/v1/uploads/signed-123?disposition=inline",
    );
  });

  it("converts relative API upload paths to canonical API origin URLs", () => {
    const expectedOrigin = getExpectedApiOrigin();
    expect(
      normalizeUploadAssetUrl("/api/v1/uploads/signed-123?disposition=inline"),
    ).toBe(`${expectedOrigin}/api/v1/uploads/signed-123?disposition=inline`);
  });

  it("keeps external URLs unchanged", () => {
    expect(normalizeUploadAssetUrl("https://example.com/image.jpg")).toBe(
      "https://example.com/image.jpg",
    );
  });

  it("keeps raw S3 presigned URLs unchanged", () => {
    expect(
      normalizeUploadAssetUrl(
        "https://biddersweet-active-storage-prod.s3.us-west-2.amazonaws.com/key?X-Amz-Signature=abc",
      ),
    ).toBe(
      "https://biddersweet-active-storage-prod.s3.us-west-2.amazonaws.com/key?X-Amz-Signature=abc",
    );
  });

  it("keeps relative URLs unchanged", () => {
    expect(normalizeUploadAssetUrl("/assets/BidderSweet.svg")).toBe(
      "/assets/BidderSweet.svg",
    );
  });

  it("returns an empty string for nullish or blank values", () => {
    expect(normalizeUploadAssetUrl(undefined)).toBe("");
    expect(normalizeUploadAssetUrl(null)).toBe("");
    expect(normalizeUploadAssetUrl("  ")).toBe("");
  });
});
