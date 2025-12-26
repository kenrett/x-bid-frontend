import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "@api/client";
import { adminPaymentsApi } from "./adminPaymentsApi";

vi.mock("@api/client", () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(client.get);
const mockedPost = vi.mocked(client.post);

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

  it("fetches and normalizes payment reconciliation", async () => {
    mockedGet.mockResolvedValue({
      data: {
        payment: {
          id: "10",
          user_email: "payer@example.com",
          amount_cents: "2500",
          status: "success",
          created_at: "2024-05-01T00:00:00Z",
          bid_pack: { id: "5", name: "Starter" },
          stripe_payment_intent_id: "pi_123",
        },
        ledger_entries: [
          {
            id: "1",
            created_at: "2024-05-01T00:00:01Z",
            kind: "credit",
            amount: "25",
            reason: "purchase",
            idempotency_key: "key-1",
          },
        ],
        balance_audit: {
          cached_balance: "100",
          derived_balance: "125",
        },
      },
    });

    const result = await adminPaymentsApi.getPayment(10);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/admin/payments/10");
    expect(result).toMatchObject({
      id: 10,
      userEmail: "payer@example.com",
      amount: 25,
      status: "succeeded",
      createdAt: "2024-05-01T00:00:00Z",
      bidPackId: 5,
      bidPackName: "Starter",
      stripePaymentIntentId: "pi_123",
      balanceAudit: {
        cachedBalance: 100,
        derivedBalance: 125,
        difference: 25,
      },
    });
    expect(result.ledgerEntries[0]).toMatchObject({
      id: 1,
      kind: "credit",
      reason: "purchase",
      idempotencyKey: "key-1",
    });
  });

  it("calls repair credits and surfaces repair flags", async () => {
    mockedPost.mockResolvedValue({
      data: { repaired: true, idempotent: false, message: "Applied fixes" },
    });

    const response = await adminPaymentsApi.repairCredits(10);

    expect(mockedPost).toHaveBeenCalledWith(
      "/api/v1/admin/payments/10/repair_credits",
    );
    expect(response).toEqual({
      repaired: true,
      idempotent: false,
      message: "Applied fixes",
    });
  });
});
