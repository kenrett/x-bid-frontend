import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("theme bootstrap ordering", () => {
  it("loads color-mode bootstrap script before app entrypoint", () => {
    const html = readFileSync(
      path.resolve(__dirname, "../../index.html"),
      "utf-8",
    );
    const bootstrapIndex = html.indexOf('src="/color-mode-init.js"');
    const mainIndex = html.indexOf('src="/src/main.tsx"');

    expect(bootstrapIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeGreaterThan(-1);
    expect(bootstrapIndex).toBeLessThan(mainIndex);
  });
});
