import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "@api/client";
import { adminPaymentsApi } from "./adminPaymentsApi";

vi.mock("@api/client", () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

const mockedGet = vi.mocked(client.get);

describe("adminPaymentsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes payments from array payload", async () => {
    mockedGet.mockResolvedValue({
      data: [
        {
          id: "1",
          amount_cents: "1999",
          status: "paid",
          created_at: "2024-01-01",
          user_email: "a@example.com",
        },
      ],
    });

    const payments = await adminPaymentsApi.listPayments();
    expect(payments).toEqual([
      {
        id: 1,
        userEmail: "a@example.com",
        amount: 19.99,
        status: "succeeded",
        createdAt: "2024-01-01",
      },
    ]);
  });

  it("handles nested payments list and mixed fields", async () => {
    mockedGet.mockResolvedValue({
      data: {
        payments: [
          {
            payment_id: "2",
            total: "10",
            payment_status: "failure",
            timestamp: "2024-02-02",
            user: { email: "b@example.com" },
          },
        ],
      },
    });

    const payments = await adminPaymentsApi.listPayments();
    expect(payments[0]).toMatchObject({
      id: 2,
      userEmail: "b@example.com",
      amount: 10,
      status: "failed",
      createdAt: "2024-02-02",
    });
  });

  it("normalizes different status labels and cents fallback", async () => {
    mockedGet.mockResolvedValue({
      data: [
        {
          id: 3,
          subtotal: "5.5",
          status: "processing",
          createdAt: "2024-03-03",
          email: "c@example.com",
        },
        {
          id: "4",
          total_cents: 1234,
          state: "refunded",
          userEmail: "d@example.com",
        },
      ],
    });

    const payments = await adminPaymentsApi.listPayments();

    expect(payments[0]).toMatchObject({
      id: 3,
      amount: 5.5,
      status: "pending",
      createdAt: "2024-03-03",
      userEmail: "c@example.com",
    });

    expect(payments[1]).toMatchObject({
      id: 4,
      amount: 12.34,
      status: "failed",
      createdAt: expect.any(String),
      userEmail: "d@example.com",
    });
  });
});
