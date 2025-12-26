import { describe, expect, it } from "vitest";
import { buildApiUrl } from "./client";

describe("buildApiUrl", () => {
  it("joins base without trailing slash and path with leading slash", () => {
    const url = buildApiUrl("/api/v1/wallet", "http://localhost:3000");
    expect(url).toBe("http://localhost:3000/api/v1/wallet");
  });

  it("strips double trailing slashes on base and leading slashes on path", () => {
    const url = buildApiUrl("api/v1/wallet", "http://localhost:3000//");
    expect(url).toBe("http://localhost:3000/api/v1/wallet");
  });

  it("keeps single separator when base ends with slash and path has one", () => {
    const url = buildApiUrl(
      "/api/v1/wallet/transactions",
      "http://localhost:3000/",
    );
    expect(url).toBe("http://localhost:3000/api/v1/wallet/transactions");
  });
});
