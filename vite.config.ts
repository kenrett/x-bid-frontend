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
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: resolve(__dirname, "./src/test/setup.ts"),
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
};

// https://vite.dev/config/
export default defineConfig(config);
