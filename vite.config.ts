/// <reference types="vitest" />

import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import fs from "node:fs";
import type { UserConfig as VitestUserConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";

const readVercelCspHeader = (): string | null => {
  try {
    const raw = fs.readFileSync(resolve(__dirname, "vercel.json"), "utf8");
    const parsed = JSON.parse(raw) as {
      headers?: Array<{
        source?: string;
        headers?: Array<{ key?: string; value?: string }>;
      }>;
    };
    const allHeaders = parsed.headers ?? [];
    for (const entry of allHeaders) {
      const header = entry.headers?.find(
        (h) => h.key === "Content-Security-Policy",
      );
      if (header?.value) return header.value;
    }
    return null;
  } catch {
    return null;
  }
};

const config: UserConfig & { test: VitestUserConfig["test"] } = {
  plugins: [
    react(),
    tailwindcss(),
    process.env.ANALYZE === "true"
      ? visualizer({
          filename: process.env.BUNDLE_ANALYZE_OUT ?? "docs/bundle/stats.json",
          template: "raw-data",
          gzipSize: true,
          brotliSize: true,
          open: false,
        })
      : undefined,
  ],
  resolve: {
    alias: {
      "@api": resolve(__dirname, "./src/api"),
      "@features": resolve(__dirname, "./src/features"),
      "@components": resolve(__dirname, "./src/components"),
      "@services": resolve(__dirname, "./src/services"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@sentryClient": resolve(__dirname, "./src/sentryClient"),
      "react-error-boundary": resolve(
        __dirname,
        "./src/vendor/react-error-boundary",
      ),
    },
  },
  build: {
    sourcemap: true,
  },
  server: {
    host: true,
    allowedHosts: ["lvh.me", "localhost"],
  },
  preview:
    process.env.VITE_E2E_TESTS === "true"
      ? {
          allowedHosts: ["localhost", "lvh.me", ".lvh.me"],
          headers: (() => {
            const csp = readVercelCspHeader();
            return csp ? { "Content-Security-Policy": csp } : undefined;
          })(),
        }
      : undefined,
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: resolve(__dirname, "./src/test/setup.ts"),
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/api/openapi-types.ts",
        "src/api/openapi-helpers.ts",
        "src/vendor/**",
        "src/types/**",
        "src/features/**/types/**",
        "src/services/*.d.ts",
        "src/**/index.tsx", // barrel-only files
        "src/components/**/PrivacyPolicy.tsx",
        "src/components/**/TermsAndConditions.tsx",
        "src/components/**/HowItWorks.tsx",
        "playwright.config.*",
        "tailwind.config.*",
        "src/App.tsx",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        statements: 55,
        branches: 60,
        functions: 55,
        lines: 55,
      },
    },
  },
};

// https://vite.dev/config/
export default defineConfig(config);
