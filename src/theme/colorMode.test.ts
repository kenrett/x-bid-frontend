import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  COLOR_MODE_STORAGE_KEY,
  applyColorModeToDocument,
  getNextColorModePreference,
  normalizeColorModePreference,
  readColorModePreference,
  resolveColorMode,
  writeColorModePreference,
} from "./colorMode";

describe("colorMode resolver", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.colorMode = "";
    document.documentElement.dataset.colorModePreference = "";
  });

  it("defaults to system when storage value is missing or invalid", () => {
    expect(readColorModePreference()).toBe("system");
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "unknown");
    expect(readColorModePreference()).toBe("system");
  });

  it("normalizes and resolves system mode", () => {
    expect(normalizeColorModePreference("dark")).toBe("dark");
    expect(normalizeColorModePreference("bad")).toBe("system");
    expect(resolveColorMode("system", "dark")).toBe("dark");
    expect(resolveColorMode("system", "light")).toBe("light");
  });

  it("persists preference and applies data attributes", () => {
    writeColorModePreference("dark");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");

    applyColorModeToDocument("dark");
    expect(document.documentElement.dataset.colorModePreference).toBe("dark");
    expect(document.documentElement.dataset.colorMode).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("falls back safely when localStorage throws", () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementationOnce(() => {
        throw new Error("storage blocked");
      });

    expect(readColorModePreference()).toBe("system");
    getItemSpy.mockRestore();
  });

  it("cycles modes in the expected order", () => {
    expect(getNextColorModePreference("system")).toBe("light");
    expect(getNextColorModePreference("light")).toBe("dark");
    expect(getNextColorModePreference("dark")).toBe("system");
  });
});
