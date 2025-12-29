import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "@api/client";
import { purchasesApi } from "./purchasesApi";

vi.mock("@api/client", () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

const mockedGet = vi.mocked(client.get);

describe("purchasesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps receipt_url to receiptUrl when present", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        id: 123,
        created_at: "2024-05-01T10:00:00Z",
        bid_pack_name: "Starter Pack",
        amount_cents: 1000,
        currency: "usd",
        status: "paid",
        receipt_url: "https://stripe.com/receipt/123",
        stripe_charge_id: "ch_123",
        stripe_event_id: "evt_123",
      },
    });

    const purchase = await purchasesApi.get(123);
    expect(purchase.receiptUrl).toBe("https://stripe.com/receipt/123");
    expect(purchase.stripeChargeId).toBe("ch_123");
    expect(purchase.stripeEventId).toBe("evt_123");
  });

  it("does not emit a receiptUrl when receipt_url is missing/blank", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        id: 124,
        created_at: "2024-05-01T10:00:00Z",
        bid_pack_name: "Starter Pack",
        amount_cents: 1000,
        currency: "usd",
        status: "paid",
      },
    });

    const purchaseMissing = await purchasesApi.get(124);
    expect(purchaseMissing.receiptUrl).toBeNull();

    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 125,
          created_at: "2024-05-01T10:00:00Z",
          bid_pack_name: "Starter Pack",
          amount_cents: 1000,
          currency: "usd",
          status: "paid",
          receipt_url: "   ",
        },
      ],
    });

    const purchases = await purchasesApi.list();
    expect(purchases[0]?.receiptUrl).toBeNull();
  });
});
