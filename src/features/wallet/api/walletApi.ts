import client from "@api/client";
import { reportUnexpectedResponse } from "@services/unexpectedResponse";
import type {
  WalletSummary,
  WalletTransaction,
  WalletTransactionsPage,
} from "../types/wallet";

type PageParams = {
  page?: number;
  perPage?: number;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractWalletRecord = (payload: unknown): Record<string, unknown> => {
  const root = (payload ?? {}) as Record<string, unknown>;
  const nested =
    (root as { wallet?: unknown }).wallet && typeof root.wallet === "object"
      ? (root.wallet as Record<string, unknown>)
      : root;

  if (!nested || typeof nested !== "object") {
    throw reportUnexpectedResponse("wallet.getWallet", payload);
  }

  return nested;
};

const normalizeWallet = (payload: unknown): WalletSummary => {
  const data = (payload ?? {}) as Record<string, unknown>;
  const rawBalance =
    toNumber(data.balance) ??
    toNumber((data as { credits?: unknown }).credits) ??
    toNumber((data as { credits_balance?: unknown }).credits_balance) ??
    toNumber((data as { creditsBalance?: unknown }).creditsBalance) ??
    toNumber((data as { bid_credits?: unknown }).bid_credits) ??
    toNumber((data as { bidCredits?: unknown }).bidCredits);

  const balanceCents =
    toNumber((data as { balance_cents?: unknown }).balance_cents) ??
    toNumber((data as { balanceCents?: unknown }).balanceCents);

  const asOf =
    typeof data.as_of === "string"
      ? data.as_of
      : typeof data.asOf === "string"
        ? data.asOf
        : typeof data.updated_at === "string"
          ? data.updated_at
          : typeof data.updatedAt === "string"
            ? data.updatedAt
            : null;

  const currency =
    typeof data.currency === "string"
      ? data.currency
      : typeof (data as { currency_code?: unknown }).currency_code === "string"
        ? (data as { currency_code: string }).currency_code
        : typeof (data as { currencyCode?: unknown }).currencyCode === "string"
          ? (data as { currencyCode: string }).currencyCode
          : null;

  if (rawBalance === null && balanceCents === null) {
    throw reportUnexpectedResponse("wallet.normalizeWallet.balance", payload);
  }

  const creditsBalance =
    rawBalance ?? (balanceCents !== null ? balanceCents / 100 : 0);

  return {
    creditsBalance,
    asOf,
    currency,
  };
};

const extractTransactionsArray = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.transactions,
    record.wallet_transactions,
    record.walletTransactions,
    record.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.data)) return nested.data;
      if (Array.isArray(nested.transactions)) return nested.transactions;
    }
  }

  return null;
};

const coerceString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const normalizeTransaction = (raw: unknown): WalletTransaction => {
  const data = (raw ?? {}) as Record<string, unknown>;

  const idValue =
    coerceString(data.id) ??
    coerceString((data as { uuid?: unknown }).uuid) ??
    coerceString((data as { transaction_id?: unknown }).transaction_id) ??
    coerceString((data as { transactionId?: unknown }).transactionId) ??
    (toNumber(data.id) !== null ? String(toNumber(data.id)) : null);

  if (!idValue) {
    throw reportUnexpectedResponse("wallet.normalizeTransaction.id", raw);
  }

  const amountCents =
    toNumber((data as { amount_cents?: unknown }).amount_cents) ??
    toNumber((data as { amountCents?: unknown }).amountCents);

  const amountSource =
    toNumber(data.amount) ??
    toNumber((data as { credits?: unknown }).credits) ??
    toNumber((data as { credit_delta?: unknown }).credit_delta) ??
    toNumber((data as { creditDelta?: unknown }).creditDelta);

  const amount =
    amountCents !== null && amountCents !== undefined
      ? amountCents / 100
      : (amountSource ?? 0);

  const occurredAt =
    coerceString(data.created_at) ??
    coerceString((data as { occurred_at?: unknown }).occurred_at) ??
    coerceString((data as { occurredAt?: unknown }).occurredAt) ??
    coerceString((data as { timestamp?: unknown }).timestamp) ??
    coerceString((data as { date?: unknown }).date) ??
    "";

  const purchaseUrl =
    coerceString((data as { purchase_url?: unknown }).purchase_url) ??
    coerceString((data as { purchaseUrl?: unknown }).purchaseUrl) ??
    coerceString((data as { payment_url?: unknown }).payment_url);

  const auctionUrlFromId =
    toNumber((data as { auction_id?: unknown }).auction_id) ??
    toNumber((data as { auctionId?: unknown }).auctionId);

  const auctionUrl =
    coerceString((data as { auction_url?: unknown }).auction_url) ??
    coerceString((data as { auctionUrl?: unknown }).auctionUrl) ??
    (auctionUrlFromId !== null ? `/auctions/${auctionUrlFromId}` : null);

  return {
    id: idValue,
    occurredAt,
    kind:
      coerceString(data.kind) ??
      coerceString((data as { type?: unknown }).type) ??
      "unknown",
    amount: Number.isFinite(amount) ? amount : 0,
    reason:
      coerceString(data.reason) ??
      coerceString((data as { description?: unknown }).description) ??
      coerceString((data as { memo?: unknown }).memo) ??
      null,
    purchaseUrl,
    auctionUrl,
  };
};

const extractPageMeta = (
  payload: unknown,
  fallback: { page: number; perPage: number },
  loadedCount: number,
): Pick<
  WalletTransactionsPage,
  "page" | "perPage" | "hasMore" | "totalCount"
> => {
  const record = (payload ?? {}) as Record<string, unknown>;
  const metaCandidate =
    (record.meta && typeof record.meta === "object" ? record.meta : null) ??
    (record.pagination && typeof record.pagination === "object"
      ? record.pagination
      : null) ??
    (record.pagy && typeof record.pagy === "object" ? record.pagy : null);
  const meta = metaCandidate as Record<string, unknown> | null;

  const page =
    toNumber(meta?.page) ??
    toNumber((meta as { current_page?: unknown })?.current_page) ??
    toNumber((meta as { currentPage?: unknown })?.currentPage) ??
    fallback.page;

  const perPage =
    toNumber(meta?.per_page) ??
    toNumber((meta as { items?: unknown })?.items) ??
    toNumber((meta as { entries?: unknown })?.entries) ??
    fallback.perPage;

  const totalPages =
    toNumber(meta?.total_pages) ??
    toNumber((meta as { pages?: unknown })?.pages);

  const nextPage =
    toNumber((meta as { next_page?: unknown })?.next_page) ??
    toNumber((meta as { next?: unknown })?.next) ??
    toNumber((meta as { nextPage?: unknown })?.nextPage) ??
    (page && totalPages ? (page < totalPages ? page + 1 : null) : null);

  const hasMoreExplicit =
    typeof meta?.has_more === "boolean"
      ? Boolean(meta?.has_more)
      : typeof (meta as { hasMore?: unknown })?.hasMore === "boolean"
        ? Boolean((meta as { hasMore: boolean }).hasMore)
        : null;

  const hasMore =
    hasMoreExplicit ??
    (typeof nextPage === "number"
      ? true
      : totalPages !== null && page !== null
        ? page < totalPages
        : loadedCount >= perPage);

  const totalCount =
    toNumber(meta?.total) ??
    toNumber((meta as { count?: unknown })?.count) ??
    toNumber((meta as { records?: unknown })?.records) ??
    null;

  return {
    page: page ?? fallback.page,
    perPage: perPage ?? fallback.perPage,
    hasMore,
    totalCount,
  };
};

export const walletApi = {
  async getWallet(): Promise<WalletSummary> {
    const response = await client.get<unknown>("/api/v1/wallet");
    const record = extractWalletRecord(response.data);
    return normalizeWallet(record);
  },

  async listTransactions(
    params: PageParams = {},
  ): Promise<WalletTransactionsPage> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 25;
    const response = await client.get<unknown>("/api/v1/wallet/transactions", {
      params: { page, per_page: perPage },
    });

    const payload: unknown = response.data ?? {};
    const list = extractTransactionsArray(payload);
    if (!Array.isArray(list)) {
      throw reportUnexpectedResponse("wallet.listTransactions", payload);
    }

    const transactions = list.map((item) => normalizeTransaction(item));
    const meta = extractPageMeta(
      payload,
      { page, perPage },
      transactions.length,
    );

    return {
      ...meta,
      transactions,
    };
  },
};
