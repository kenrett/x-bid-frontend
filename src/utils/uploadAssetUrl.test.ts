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
