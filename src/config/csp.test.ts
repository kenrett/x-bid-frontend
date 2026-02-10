import fs from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getCsp } from "./csp";

const readVercelCspHeader = (): string => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const raw = fs.readFileSync(resolve(root, "vercel.json"), "utf8");
  const parsed = JSON.parse(raw) as {
    headers?: Array<{
      headers?: Array<{ key?: string; value?: string }>;
    }>;
  };
  const allHeaders = parsed.headers ?? [];
  for (const entry of allHeaders) {
    const header = entry.headers?.find(
      (item) => item.key === "Content-Security-Policy",
    );
    if (header?.value) return header.value;
  }
  throw new Error("Content-Security-Policy header not found in vercel.json");
};

describe("CSP", () => {
  it("keeps production CSP free of localhost", () => {
    const csp = getCsp({ env: "production" });
    expect(csp).not.toContain("localhost");
    expect(csp).not.toContain("127.0.0.1");
  });

  it("includes localhost allowances in development CSP", () => {
    const csp = getCsp({ env: "development" });
    expect(csp).toContain("http://localhost:*");
    expect(csp).toContain("ws://localhost:*");
    expect(csp).toContain("http://127.0.0.1:*");
    expect(csp).toContain("ws://127.0.0.1:*");
    expect(csp).toContain("'unsafe-inline'");
    expect(csp).toContain("'unsafe-eval'");
  });

  it("keeps production CSP free of unsafe inline/eval script allowances", () => {
    const csp = getCsp({ env: "production" });
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("keeps vercel.json CSP in sync with production CSP", () => {
    const vercelCsp = readVercelCspHeader();
    const prodCsp = getCsp({ env: "production" });
    expect(vercelCsp).toBe(prodCsp);
  });
});
