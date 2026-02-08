import client from "@api/client";
import type { paths } from "@api/openapi-types";
import type {
  AdminLedgerEntry,
  AdminPaymentReconciliation,
  Payment,
} from "@features/admin/types/users";

type AdminPaymentsResponse = paths["/api/v1/admin/payments"]["get"] extends {
  responses: { 200: { content: { "application/json": infer T } } };
}
  ? T
  : unknown;

type AdminPaymentsPayload = AdminPaymentsResponse extends { payments: infer P }
  ? P
  : AdminPaymentsResponse;

type RawPayment =
  AdminPaymentsPayload extends Array<infer Item>
    ? Item
    : AdminPaymentsResponse extends Array<infer Item>
      ? Item
      : Record<string, unknown>;

type OpenApiJsonRequestBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends {
  requestBody?: { content: { "application/json": infer T } };
}
  ? T
  : never;

type AdminPaymentDetailResponse = {
  purchase?: unknown;
  payment?: unknown;
  ledger_entries?: unknown[];
  ledgerEntries?: unknown[];
  credit_transactions?: unknown[];
  creditTransactions?: unknown[];
  balance_audit?: Record<string, unknown>;
  balance?: Record<string, unknown>;
  balanceAudit?: Record<string, unknown>;
};

type AdminRepairCreditsResponse = {
  repaired?: boolean;
  idempotent?: boolean;
  message?: string;
  updated?: boolean;
  changes_applied?: boolean;
  status?: string;
  detail?: string;
};

type AdminRefundPaymentResponse = {
  payment?: unknown;
  purchase?: unknown;
  refund_id?: unknown;
  refundId?: unknown;
  refunded_cents?: unknown;
  refundedCents?: unknown;
} & Record<string, unknown>;

type AdminRefundRequestBody = OpenApiJsonRequestBody<
  "/api/v1/admin/payments/{id}/refund",
  "post"
>;

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeStatus = (value: unknown): Payment["status"] => {
  const status = typeof value === "string" ? value.toLowerCase() : "";
  if (status === "succeeded" || status === "paid" || status === "success")
    return "succeeded";
  if (
    status === "failed" ||
    status === "failure" ||
    status === "canceled" ||
    status === "cancelled" ||
    status === "refunded" ||
    status === "error"
  ) {
    return "failed";
  }
  if (
    status === "pending" ||
    status === "processing" ||
    status === "requires_action"
  ) {
    return "pending";
  }
  return "pending";
};

const extractRefundMeta = (
  raw: unknown,
): { refundId: string | null; refundedCents: number | null } => {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const refundId =
    typeof record.refund_id === "string"
      ? record.refund_id
      : typeof record.refundId === "string"
        ? record.refundId
        : null;

  const refundedCents =
    toNumber(record.refunded_cents) ?? toNumber(record.refundedCents) ?? null;

  return { refundId, refundedCents };
};

const normalizePayment = (raw: RawPayment): Payment => {
  const data = (raw ?? {}) as Record<string, unknown>;
  const user = data.user as Record<string, unknown> | undefined;

  const cents =
    toNumber((data as { amount_cents?: unknown }).amount_cents) ??
    toNumber((data as { amountCents?: unknown }).amountCents) ??
    toNumber((data as { total_cents?: unknown }).total_cents) ??
    toNumber((data as { totalCents?: unknown }).totalCents);

  const amountSource =
    toNumber(data.amount) ??
    toNumber((data as { total?: unknown }).total) ??
    toNumber((data as { subtotal?: unknown }).subtotal) ??
    cents;

  const amount =
    cents !== null && cents !== undefined
      ? Number(cents) / 100
      : (amountSource ?? 0);

  const status = normalizeStatus(
    data.status ??
      (data as { payment_status?: unknown }).payment_status ??
      (data as { state?: unknown }).state,
  );

  const createdAt =
    typeof data.created_at === "string"
      ? data.created_at
      : typeof data.createdAt === "string"
        ? data.createdAt
        : typeof (data as { timestamp?: unknown }).timestamp === "string"
          ? (data as { timestamp: string }).timestamp
          : new Date().toISOString();

  const userEmail =
    typeof data.user_email === "string"
      ? data.user_email
      : typeof data.userEmail === "string"
        ? data.userEmail
        : typeof data.email === "string"
          ? data.email
          : user && typeof user.email === "string"
            ? user.email
            : "";

  const id =
    toNumber(data.id) ??
    toNumber((data as { payment_id?: unknown }).payment_id) ??
    toNumber((data as { stripe_payment_id?: unknown }).stripe_payment_id) ??
    0;

  return {
    id,
    userEmail,
    amount: Number.isFinite(amount) ? amount : 0,
    status,
    createdAt,
    stripeCheckoutSessionId:
      typeof (data as { stripe_checkout_session_id?: unknown })
        .stripe_checkout_session_id === "string"
        ? (data as { stripe_checkout_session_id: string })
            .stripe_checkout_session_id
        : null,
    stripePaymentIntentId:
      typeof (data as { stripe_payment_intent_id?: unknown })
        .stripe_payment_intent_id === "string"
        ? (data as { stripe_payment_intent_id: string })
            .stripe_payment_intent_id
        : null,
    stripeEventId:
      typeof (data as { stripe_event_id?: unknown }).stripe_event_id ===
      "string"
        ? (data as { stripe_event_id: string }).stripe_event_id
        : null,
  };
};

const normalizeLedgerEntry = (raw: unknown): AdminLedgerEntry => {
  const data = (raw ?? {}) as Record<string, unknown>;
  const amountCents =
    toNumber((data as { amount_cents?: unknown }).amount_cents) ??
    toNumber((data as { amountCents?: unknown }).amountCents);
  const amount =
    amountCents !== null && amountCents !== undefined
      ? Number(amountCents) / 100
      : (toNumber(data.amount) ?? 0);

  return {
    id:
      toNumber(data.id) ??
      toNumber((data as { entry_id?: unknown }).entry_id) ??
      0,
    createdAt:
      typeof data.created_at === "string"
        ? data.created_at
        : typeof data.createdAt === "string"
          ? data.createdAt
          : "",
    kind:
      typeof data.kind === "string"
        ? data.kind
        : typeof (data as { type?: unknown }).type === "string"
          ? (data as { type: string }).type
          : "unknown",
    amount,
    reason:
      typeof data.reason === "string"
        ? data.reason
        : typeof (data as { description?: unknown }).description === "string"
          ? (data as { description: string }).description
          : null,
    idempotencyKey:
      typeof (data as { idempotency_key?: unknown }).idempotency_key ===
      "string"
        ? (data as { idempotency_key: string }).idempotency_key
        : typeof (data as { idempotencyKey?: unknown }).idempotencyKey ===
            "string"
          ? (data as { idempotencyKey: string }).idempotencyKey
          : null,
  };
};

const normalizeReconciliation = (
  raw: AdminPaymentDetailResponse,
): AdminPaymentReconciliation => {
  const data = raw ?? {};
  const payment =
    (data as { purchase?: unknown }).purchase ??
    (data as { payment?: unknown }).payment ??
    data;

  const paymentData = (payment ?? {}) as Record<string, unknown>;
  const bidPack =
    (paymentData as { bid_pack?: unknown }).bid_pack ??
    (paymentData as { bidPack?: unknown }).bidPack ??
    (paymentData as { bid_pack_purchase?: unknown }).bid_pack_purchase;

  const cents =
    toNumber((paymentData as { amount_cents?: unknown }).amount_cents) ??
    toNumber((paymentData as { amountCents?: unknown }).amountCents) ??
    toNumber((paymentData as { total_cents?: unknown }).total_cents) ??
    toNumber((paymentData as { totalCents?: unknown }).totalCents);

  const amountSource =
    toNumber(paymentData.amount) ??
    toNumber((paymentData as { total?: unknown }).total) ??
    toNumber((paymentData as { subtotal?: unknown }).subtotal) ??
    cents;

  const amount =
    cents !== null && cents !== undefined
      ? Number(cents) / 100
      : (amountSource ?? 0);

  const ledgerEntries = Array.isArray(
    (data as { credit_transactions?: unknown }).credit_transactions,
  )
    ? (data as { credit_transactions: unknown[] }).credit_transactions
    : Array.isArray(
          (data as { creditTransactions?: unknown }).creditTransactions,
        )
      ? (data as { creditTransactions: unknown[] }).creditTransactions
      : Array.isArray((data as { ledger_entries?: unknown }).ledger_entries)
        ? (data as { ledger_entries: unknown[] }).ledger_entries
        : Array.isArray((data as { ledgerEntries?: unknown }).ledgerEntries)
          ? (data as { ledgerEntries: unknown[] }).ledgerEntries
          : [];

  const balanceSource =
    (data as { balance_audit?: unknown }).balance_audit ??
    (data as { balanceAudit?: unknown }).balanceAudit ??
    (data as { balance?: unknown }).balance ??
    {};

  const cachedBalance =
    toNumber(
      (balanceSource as { cached?: unknown }).cached ??
        (balanceSource as { cached_balance?: unknown }).cached_balance ??
        (balanceSource as { cachedBalance?: unknown }).cachedBalance,
    ) ?? 0;

  const derivedBalance =
    toNumber(
      (balanceSource as { derived?: unknown }).derived ??
        (balanceSource as { derived_balance?: unknown }).derived_balance ??
        (balanceSource as { derivedBalance?: unknown }).derivedBalance,
    ) ?? cachedBalance;

  const difference =
    toNumber((balanceSource as { difference?: unknown }).difference) ??
    derivedBalance - cachedBalance;

  const matches =
    typeof (balanceSource as { matches?: unknown }).matches === "boolean"
      ? Boolean((balanceSource as { matches: boolean }).matches)
      : Math.abs(difference) < 0.0001;

  const id =
    toNumber(paymentData.id) ??
    toNumber((paymentData as { payment_id?: unknown }).payment_id) ??
    0;

  return {
    id,
    userEmail:
      typeof paymentData.user_email === "string"
        ? paymentData.user_email
        : typeof paymentData.userEmail === "string"
          ? paymentData.userEmail
          : "",
    amount: Number.isFinite(amount) ? amount : 0,
    currency:
      typeof paymentData.currency === "string"
        ? paymentData.currency
        : typeof (paymentData as { currency_code?: unknown }).currency_code ===
            "string"
          ? (paymentData as { currency_code: string }).currency_code
          : null,
    status: normalizeStatus(
      paymentData.status ??
        (paymentData as { payment_status?: unknown }).payment_status ??
        (paymentData as { state?: unknown }).state,
    ),
    createdAt:
      typeof paymentData.created_at === "string"
        ? paymentData.created_at
        : typeof paymentData.createdAt === "string"
          ? paymentData.createdAt
          : "",
    bidPackId:
      toNumber((bidPack as { id?: unknown })?.id) ??
      toNumber((bidPack as { bid_pack_id?: unknown })?.bid_pack_id) ??
      null,
    bidPackName:
      typeof (bidPack as { name?: unknown })?.name === "string"
        ? (bidPack as { name: string }).name
        : typeof (bidPack as { title?: unknown })?.title === "string"
          ? (bidPack as { title: string }).title
          : null,
    stripeCheckoutSessionId:
      typeof (paymentData as { stripe_checkout_session_id?: unknown })
        .stripe_checkout_session_id === "string"
        ? (paymentData as { stripe_checkout_session_id: string })
            .stripe_checkout_session_id
        : null,
    stripePaymentIntentId:
      typeof (paymentData as { stripe_payment_intent_id?: unknown })
        .stripe_payment_intent_id === "string"
        ? (paymentData as { stripe_payment_intent_id: string })
            .stripe_payment_intent_id
        : typeof (paymentData as { payment_intent_id?: unknown })
              .payment_intent_id === "string"
          ? (paymentData as { payment_intent_id: string }).payment_intent_id
          : null,
    stripeChargeId:
      typeof (paymentData as { stripe_charge_id?: unknown })
        .stripe_charge_id === "string"
        ? (paymentData as { stripe_charge_id: string }).stripe_charge_id
        : null,
    stripeCustomerId:
      typeof (paymentData as { stripe_customer_id?: unknown })
        .stripe_customer_id === "string"
        ? (paymentData as { stripe_customer_id: string }).stripe_customer_id
        : null,
    stripeInvoiceId:
      typeof (paymentData as { stripe_invoice_id?: unknown })
        .stripe_invoice_id === "string"
        ? (paymentData as { stripe_invoice_id: string }).stripe_invoice_id
        : null,
    stripeEventId:
      typeof (paymentData as { stripe_event_id?: unknown }).stripe_event_id ===
      "string"
        ? (paymentData as { stripe_event_id: string }).stripe_event_id
        : null,
    ledgerEntries: ledgerEntries.map((entry) => normalizeLedgerEntry(entry)),
    balanceAudit: {
      cachedBalance,
      derivedBalance,
      difference,
      matches,
    },
  };
};

const normalizeRepairResponse = (
  data: AdminRepairCreditsResponse,
): { repaired: boolean; idempotent: boolean; message?: string } => {
  const repaired =
    Boolean(data.repaired) ||
    Boolean(data.updated) ||
    Boolean(data.changes_applied) ||
    data.status === "repaired";
  const idempotent = Boolean(data.idempotent) || data.status === "noop";

  return {
    repaired,
    idempotent,
    message:
      typeof data.message === "string"
        ? data.message
        : typeof data.detail === "string"
          ? data.detail
          : undefined,
  };
};

export const adminPaymentsApi = {
  async listPayments(): Promise<Payment[]> {
    const response = await client.get<
      AdminPaymentsResponse | { payments?: AdminPaymentsPayload }
    >("/api/v1/admin/payments");

    const payload = response.data as
      | AdminPaymentsResponse
      | { payments?: unknown };

    const payments = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { payments?: unknown }).payments)
        ? (payload as { payments: unknown[] }).payments
        : [];

    return payments.map((payment) => normalizePayment(payment as RawPayment));
  },

  async getPayment(id: number): Promise<AdminPaymentReconciliation> {
    const response = await client.get<AdminPaymentDetailResponse>(
      `/api/v1/admin/payments/${id}`,
    );
    return normalizeReconciliation(response.data ?? {});
  },

  async repairCredits(
    id: number,
  ): Promise<{ repaired: boolean; idempotent: boolean; message?: string }> {
    const response = await client.post<AdminRepairCreditsResponse>(
      `/api/v1/admin/payments/${id}/repair_credits`,
    );
    return normalizeRepairResponse(response.data ?? {});
  },

  async refundPayment(
    id: number,
    payload: { amountCents?: number; fullRefund?: boolean; reason?: string },
  ): Promise<
    Payment & { refundId?: string | null; refundedCents?: number | null }
  > {
    const body: AdminRefundRequestBody = {};
    if (typeof payload.amountCents === "number") {
      body.amount_cents = payload.amountCents;
    } else if (payload.fullRefund) {
      body.full_refund = true;
    }
    if (typeof payload.reason === "string") {
      const normalizedReason = payload.reason.trim();
      if (normalizedReason) body.reason = normalizedReason;
    }

    const response = await client.post<AdminRefundPaymentResponse>(
      `/api/v1/admin/payments/${id}/refund`,
      body,
    );

    const raw = response.data ?? {};
    const paymentPayload =
      (raw as { payment?: unknown }).payment ??
      (raw as { purchase?: unknown }).purchase ??
      raw;

    const payment = normalizePayment(paymentPayload as RawPayment);
    const rawMeta = extractRefundMeta(raw);
    const paymentMeta = extractRefundMeta(paymentPayload);
    const meta = {
      refundId: paymentMeta.refundId ?? rawMeta.refundId,
      refundedCents: paymentMeta.refundedCents ?? rawMeta.refundedCents,
    };

    return { ...payment, ...meta };
  },
};
