import client from "@api/client";
import type { paths } from "@api/openapi-types";
import type { Payment } from "@components/Admin/Users/types";

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
};
