import client from "@api/client";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";
import type {
  PurchaseDetail,
  PurchaseStatus,
  PurchaseSummary,
} from "../types/purchase";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeStatus = (value: unknown): PurchaseStatus => {
  const status = typeof value === "string" ? value.toLowerCase() : "";
  if (status === "succeeded" || status === "paid" || status === "completed")
    return "succeeded";
  if (status === "refunded" || status === "refunding") return "refunded";
  if (
    status === "failed" ||
    status === "error" ||
    status === "canceled" ||
    status === "cancelled"
  )
    return "failed";
  if (
    status === "pending" ||
    status === "processing" ||
    status === "requires_action"
  )
    return "pending";
  return "pending";
};

const extractPurchasesArray = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload as unknown[];
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.purchases,
    record.data,
    (record as { purchases?: { data?: unknown[] } }).purchases?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as unknown[];
  }

  return null;
};

const normalizePurchase = (raw: unknown): PurchaseDetail => {
  const data = (raw ?? {}) as Record<string, unknown>;
  const bidPack =
    (data.bid_pack && typeof data.bid_pack === "object"
      ? (data.bid_pack as Record<string, unknown>)
      : null) ??
    ((data as { bidPack?: unknown }).bidPack &&
    typeof (data as { bidPack: unknown }).bidPack === "object"
      ? ((data as { bidPack: Record<string, unknown> }).bidPack as Record<
          string,
          unknown
        >)
      : null);

  const id =
    toNumber(data.id) ??
    toNumber((data as { purchase_id?: unknown }).purchase_id) ??
    toNumber((data as { uuid?: unknown }).uuid);

  if (id === null) {
    throw reportUnexpectedResponse("purchases.normalizePurchase.id", raw);
  }

  const amountCents =
    toNumber((data as { amount_cents?: unknown }).amount_cents) ??
    toNumber((data as { total_cents?: unknown }).total_cents) ??
    toNumber((data as { price_cents?: unknown }).price_cents);

  const amountSource =
    toNumber(data.amount) ??
    toNumber((data as { total?: unknown }).total) ??
    toNumber((data as { price?: unknown }).price);

  const amount =
    amountCents !== null && amountCents !== undefined
      ? Number(amountCents) / 100
      : (amountSource ?? 0);

  const credits =
    toNumber((data as { credits?: unknown }).credits) ??
    toNumber((data as { credit_amount?: unknown }).credit_amount) ??
    toNumber((data as { bid_credits?: unknown }).bid_credits) ??
    toNumber((bidPack as { credits?: unknown })?.credits) ??
    toNumber((bidPack as { bid_credits?: unknown })?.bid_credits) ??
    null;

  const createdAt =
    typeof data.created_at === "string"
      ? data.created_at
      : typeof data.createdAt === "string"
        ? data.createdAt
        : "";

  const currency =
    typeof data.currency === "string"
      ? data.currency
      : typeof (data as { currency_code?: unknown }).currency_code === "string"
        ? (data as { currency_code: string }).currency_code
        : typeof (data as { currencyCode?: unknown }).currencyCode === "string"
          ? (data as { currencyCode: string }).currencyCode
          : null;

  const status = normalizeStatus(
    data.status ??
      (data as { payment_status?: unknown }).payment_status ??
      (data as { state?: unknown }).state,
  );

  const bidPackId =
    toNumber((bidPack as { id?: unknown })?.id) ??
    toNumber((bidPack as { bid_pack_id?: unknown })?.bid_pack_id) ??
    null;

  const bidPackName =
    typeof (bidPack as { name?: unknown })?.name === "string"
      ? (bidPack as { name: string }).name
      : typeof (bidPack as { title?: unknown })?.title === "string"
        ? (bidPack as { title: string }).title
        : typeof (data as { bid_pack_name?: unknown }).bid_pack_name ===
            "string"
          ? (data as { bid_pack_name: string }).bid_pack_name
          : typeof (data as { bidPackName?: unknown }).bidPackName === "string"
            ? (data as { bidPackName: string }).bidPackName
            : null;

  const rawReceiptUrl =
    typeof (data as { receipt_url?: unknown }).receipt_url === "string"
      ? (data as { receipt_url: string }).receipt_url
      : typeof (data as { receiptUrl?: unknown }).receiptUrl === "string"
        ? (data as { receiptUrl: string }).receiptUrl
        : null;

  const receiptUrl =
    rawReceiptUrl && rawReceiptUrl.trim() !== "" ? rawReceiptUrl : null;

  const stripeCheckoutSessionId =
    typeof (data as { stripe_checkout_session_id?: unknown })
      .stripe_checkout_session_id === "string"
      ? (data as { stripe_checkout_session_id: string })
          .stripe_checkout_session_id
      : null;

  const stripePaymentIntentId =
    typeof (data as { stripe_payment_intent_id?: unknown })
      .stripe_payment_intent_id === "string"
      ? (data as { stripe_payment_intent_id: string }).stripe_payment_intent_id
      : null;

  const stripeChargeId =
    typeof (data as { stripe_charge_id?: unknown }).stripe_charge_id ===
    "string"
      ? (data as { stripe_charge_id: string }).stripe_charge_id
      : typeof (data as { stripeChargeId?: unknown }).stripeChargeId ===
          "string"
        ? (data as { stripeChargeId: string }).stripeChargeId
        : null;
  const stripeCustomerId = null;
  const stripeInvoiceId = null;
  const stripeEventId =
    typeof (data as { stripe_event_id?: unknown }).stripe_event_id === "string"
      ? (data as { stripe_event_id: string }).stripe_event_id
      : typeof (data as { stripeEventId?: unknown }).stripeEventId === "string"
        ? (data as { stripeEventId: string }).stripeEventId
        : null;

  return {
    id,
    createdAt,
    bidPackId,
    bidPackName,
    credits,
    amount: Number.isFinite(amount) ? amount : 0,
    currency,
    status,
    receiptUrl,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
    stripeChargeId,
    stripeCustomerId,
    stripeInvoiceId,
    stripeEventId,
  };
};

const toSummary = (purchase: PurchaseDetail): PurchaseSummary => ({
  id: purchase.id,
  createdAt: purchase.createdAt,
  bidPackId: purchase.bidPackId ?? null,
  bidPackName: purchase.bidPackName,
  credits: purchase.credits,
  amount: purchase.amount,
  currency: purchase.currency,
  status: purchase.status,
  receiptUrl: purchase.receiptUrl ?? null,
});

const list = async (): Promise<PurchaseSummary[]> => {
  const response = await client.get("/api/v1/me/purchases");
  const rawPurchases = extractPurchasesArray(response.data);

  if (!rawPurchases) {
    throw reportUnexpectedResponse("purchases.list", response.data);
  }

  return rawPurchases.map((item, index) => {
    try {
      return toSummary(normalizePurchase(item));
    } catch {
      throw reportUnexpectedResponse(`purchases.list[${index}]`, item);
    }
  });
};

const get = async (id: number | string): Promise<PurchaseDetail> => {
  const response = await client.get(`/api/v1/me/purchases/${id}`);
  try {
    return normalizePurchase(response.data);
  } catch {
    throw reportUnexpectedResponse("purchases.get", response.data);
  }
};

export const purchasesApi = {
  list,
  get,
};
