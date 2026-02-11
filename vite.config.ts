/// <reference types="vitest" />

import { defineConfig, loadEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import type { UserConfig as VitestUserConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";
import { getCsp } from "./src/config/csp";

const baseConfig: UserConfig & { test: VitestUserConfig["test"] } = {
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const csp = getCsp({
    env: mode === "development" ? "development" : "production",
    apiBaseUrl: env.VITE_API_BASE_URL,
    cableUrl: env.VITE_CABLE_URL,
  });

  return {
    ...baseConfig,
    server: {
      host: true,
      allowedHosts: [
        "main.lvh.me",
        "marketplace.lvh.me",
        "afterdark.lvh.me",
        "localhost",
      ],
      proxy: {
        "/api/v1/uploads": {
          target: "https://api.biddersweet.app",
          changeOrigin: true,
          secure: true,
        },
      },
      headers: { "Content-Security-Policy": csp },
    },
    preview:
      env.VITE_E2E_TESTS === "true"
        ? {
            allowedHosts: [
              "localhost",
              "main.lvh.me",
              "marketplace.lvh.me",
              "afterdark.lvh.me",
              ".lvh.me",
            ],
            headers: {
              "Content-Security-Policy": getCsp({ env: "production" }),
            },
          }
        : undefined,
  };
});
