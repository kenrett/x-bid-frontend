import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { AxiosError } from "axios";
import client from "./client";
import { AgeGateModal } from "../components/AgeGateModal";
import { ageGateStore } from "../ageGate/ageGateStore";

const getRejectedInterceptor = () => {
  const handlers = (
    client.interceptors.response as unknown as {
      handlers: Array<{ rejected?: (error: unknown) => unknown }>;
    }
  ).handlers;
  const handler = handlers.find((h) => typeof h.rejected === "function");
  if (!handler?.rejected) {
    throw new Error("Response interceptor not registered");
  }
  return handler.rejected;
};

describe("AGE_GATE_REQUIRED flow", () => {
  const rejected = getRejectedInterceptor();

  beforeEach(() => {
    vi.restoreAllMocks();
    ageGateStore.reset();
  });

  it("shows the age gate modal, calls accept endpoint, and retries once", async () => {
    render(<AgeGateModal />);

    const postSpy = vi
      .spyOn(client, "post")
      .mockResolvedValue({ data: {} } as unknown as never);
    const requestSpy = vi
      .spyOn(client, "request")
      .mockResolvedValue({ data: { ok: true } } as unknown as never);

    const error = {
      response: { status: 403, data: { error_code: "AGE_GATE_REQUIRED" } },
      config: { url: "/api/v1/afterdark/content", headers: {} },
    } as AxiosError;

    let flow!: Promise<unknown>;
    act(() => {
      flow = rejected(error) as Promise<unknown>;
    });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    let result: unknown;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "I am 18+" }));
      result = await flow;
    });
    expect(result).toEqual(expect.objectContaining({ data: { ok: true } }));
    expect(postSpy).toHaveBeenCalledWith(
      "/api/v1/age_gate/accept",
      {},
      expect.any(Object),
    );
    expect(requestSpy).toHaveBeenCalledTimes(1);
  });

  it("prevents infinite retry loops", async () => {
    render(<AgeGateModal />);
    const error = {
      response: { status: 403, data: { error_code: "AGE_GATE_REQUIRED" } },
      config: { url: "/api/v1/afterdark/content", __ageGateRetry: true },
    } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
