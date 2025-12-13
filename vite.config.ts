/// <reference types="vitest" />

import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import type { UserConfig as VitestUserConfig } from "vitest/config";

const config: UserConfig & { test: VitestUserConfig["test"] } = {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@api": resolve(__dirname, "./src/api"),
      "@components": resolve(__dirname, "./src/components"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@auth": resolve(__dirname, "./src/auth"),
      "@services": resolve(__dirname, "./src/services"),
      "@appTypes": resolve(__dirname, "./src/types"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@sentryClient": resolve(__dirname, "./src/sentryClient"),
      "react-error-boundary": resolve(
        __dirname,
        "./src/vendor/react-error-boundary",
      ),
    },
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
