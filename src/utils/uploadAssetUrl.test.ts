import { describe, expect, it } from "vitest";
import { normalizeUploadAssetUrl } from "./uploadAssetUrl";

describe("normalizeUploadAssetUrl", () => {
  it("normalizes api upload URLs to same-origin paths", () => {
    expect(
      normalizeUploadAssetUrl(
        "https://api.biddersweet.app/api/v1/uploads/signed-123?disposition=inline",
      ),
    ).toBe("/api/v1/uploads/signed-123?disposition=inline");
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
