import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";

const parseDotenv = (raw: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const lineRaw of raw.split(/\r?\n/)) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const idx = normalized.indexOf("=");
    if (idx === -1) continue;

    const key = normalized.slice(0, idx).trim();
    let value = normalized.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, "\n");

    if (key) out[key] = value;
  }
  return out;
};

const loadEnvFiles = (): void => {
  const mode = process.env.MODE || process.env.NODE_ENV || "test";
  const root = process.cwd();
  const candidates = [
    path.join(root, ".env"),
    path.join(root, ".env.local"),
    path.join(root, `.env.${mode}`),
    path.join(root, `.env.${mode}.local`),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const parsed = parseDotenv(fs.readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
};

loadEnvFiles();

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => cleanup());
