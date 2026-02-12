import { describe, it, expect } from "vitest";
import { statusFromApi, statusToApi } from "./status";
import type { AuctionStatus } from "../types/auction";

describe("api/status", () => {
  it("maps API statuses to internal statuses", () => {
    expect(statusFromApi("pending")).toBe("scheduled");
    expect(statusFromApi("ended")).toBe("complete");
    expect(statusFromApi("cancelled")).toBe("cancelled");
    expect(statusFromApi("active")).toBe("active");
    expect(statusFromApi("scheduled")).toBe("scheduled");
    expect(statusFromApi("complete")).toBe("complete");
    expect(statusFromApi("unexpected")).toBe("inactive");
    expect(statusFromApi(undefined)).toBe("inactive");
  });

  it("maps internal statuses to API statuses", () => {
    const cases: Array<[AuctionStatus | undefined, string]> = [
      ["scheduled", "scheduled"],
      ["complete", "complete"],
      ["active", "active"],
      ["inactive", "inactive"],
      ["cancelled", "cancelled"],
    ];

    for (const [input, output] of cases) {
      expect(statusToApi(input)).toBe(output);
    }
  });

  it("throws for undefined internal status values", () => {
    expect(() => statusToApi(undefined)).toThrow(
      "Missing auction status for API payload",
    );
  });
});
