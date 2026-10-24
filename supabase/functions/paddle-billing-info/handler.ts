// Request handling for paddle-billing-info, kept free of Deno and Supabase
// imports so every branch can be unit-tested (see handler.test.ts). index.ts
// wires the real clients into `BillingInfoDeps`.
//
// Read-only. A tenant admin sees, on Settings -> Billing, the card the
// subscription is charged to, a link to Paddle's hosted page for changing it,
// and the invoices Paddle has issued for the subscription. Two actions:
//   "overview"  payment method + update link + recent invoices.
//   "invoice"   a short-lived download link for ONE invoice PDF.
//
// Flow, in this order (the order is the security model):
//   1. CORS / method / bearer token checks.
//   2. The caller's own JWT resolves THEIR tenant and says whether they are its
//      admin. The tenant is never taken from the request.
//   3. Validate the action; rate-limit per tenant.
//   4. Load the stored subscription (service role): its Paddle subscription ID
//      is the ONLY thing that scopes what can be read.
//   5. Overview: read the subscription and its transactions from Paddle.
//      Invoice: read the transaction first and refuse unless it belongs to that
//      subscription - a transaction ID from another gym returns nothing.
//
// Only fields the screen shows are returned (no customer name, email or address).
//
// Request shapes (GET /subscriptions/{id}, GET /transactions?subscription_id=,
// GET /transactions/{id}, GET /transactions/{id}/invoice) were checked against
// Paddle's API reference through the Paddle MCP server's method search. Response
// fields (payments[].method_details, management_urls) are read defensively and
// should be confirmed against a real sandbox subscription.

import { bearerToken, corsHeaders, reply, type HttpResponse } from "../_shared/http.ts";
import { paddleAmountToMajor } from "../_shared/money.ts";

export interface BillingInfoRequest {
  method: string;
  origin: string | null;
  authorization: string | null;
  bodyText: string;
}

export type BillingInfoResponse = HttpResponse;

/** Who is calling, from the database's point of view. */
export interface Caller {
  tenant_id: string;
  is_admin: boolean;
}

/** The platform_subscriptions columns this function needs. */
export interface StoredSubscription {
  status: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
}

export type PaddleData = { ok: true; data: unknown } | { ok: false; status: number; detail: string };

export interface BillingInfoDeps {
  allowedOrigins: string[];
  /** false when PADDLE_API_KEY is not set. */
  paddleConfigured: boolean;
  getCaller(token: string): Promise<Caller | null>;
  loadSubscription(tenantId: string): Promise<StoredSubscription | null>;
  /** true = under the limit. */
  rateLimit(key: string, max: number): Promise<boolean>;
  getSubscription(subscriptionId: string): Promise<PaddleData>;
  listTransactions(subscriptionId: string): Promise<PaddleData>;
  getTransaction(transactionId: string): Promise<PaddleData>;
  getInvoiceUrl(transactionId: string): Promise<PaddleData>;
  log(message: string, detail?: unknown): void;
}

const MAX_BODY_BYTES = 1_000;
const TRANSACTION_ID = /^txn_[a-z0-9]{20,40}$/;

export type Action = { action: "overview" } | { action: "invoice"; transactionId: string };

export function parseAction(raw: unknown): Action | null {
  if (!isRecord(raw)) return null;
  if (raw.action === "overview") return { action: "overview" };
  if (raw.action === "invoice" && typeof raw.transaction_id === "string" && TRANSACTION_ID.test(raw.transaction_id)) {
    return { action: "invoice", transactionId: raw.transaction_id };
  }
  return null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asIso = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
};

const asText = (value: unknown, max = 40): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, max) : null;

export interface PaymentMethod {
  /** "card", "paypal", ... as Paddle names it. */
  type: string;
  /** Card brand ("visa", "mastercard", ...), when it is a card. */
  brand: string | null;
  last4: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
}

export interface Invoice {
  id: string;
  number: string | null;
  billed_at: string | null;
  status: string;
  total: { amount: number; currency: string } | null;
  /** Paddle has no PDF for an unpaid or zero-value transaction. */
  can_download: boolean;
}

/** Statuses worth showing a customer: not drafts, not ones that never went out. */
const SHOWN_STATUSES = new Set(["billed", "paid", "completed", "past_due"]);

function readInvoice(raw: unknown): Invoice | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" && TRANSACTION_ID.test(raw.id) ? raw.id : null;
  const status = typeof raw.status === "string" ? raw.status : null;
  if (!id || !status || !SHOWN_STATUSES.has(status)) return null;

  const totals = isRecord(raw.details) && isRecord(raw.details.totals) ? raw.details.totals : null;
  const currency =
    (totals && typeof totals.currency_code === "string" ? totals.currency_code : null) ??
    (typeof raw.currency_code === "string" ? raw.currency_code : null);
  let total: Invoice["total"] = null;
  if (totals && currency) {
    for (const key of ["grand_total", "total"]) {
      const amount = paddleAmountToMajor(totals[key], currency);
      if (amount !== null) {
        total = { amount, currency };
        break;
      }
    }
  }

  return {
    id,
    number: asText(raw.invoice_number),
    billed_at: asIso(raw.billed_at) ?? asIso(raw.created_at),
    status,
    total,
    can_download: status === "completed" && total !== null && total.amount > 0,
  };
}

/**
 * The card (or other method) the subscription was last paid with: the newest
 * captured payment across its transactions. Only the brand, last four digits
 * and expiry leave this function.
 */
export function readPaymentMethod(transactions: unknown[]): PaymentMethod | null {
  for (const txn of transactions) {
    if (!isRecord(txn) || !Array.isArray(txn.payments)) continue;
    // Newest attempt first within a transaction.
    const payments = [...txn.payments].reverse();
    for (const payment of payments) {
      if (!isRecord(payment) || payment.status !== "captured" || !isRecord(payment.method_details)) continue;
      const details = payment.method_details;
      const type = asText(details.type);
      if (!type) continue;
      const card = isRecord(details.card) ? details.card : null;
      const month = card && typeof card.expiry_month === "number" ? card.expiry_month : null;
      const year = card && typeof card.expiry_year === "number" ? card.expiry_year : null;
      const last4 = card && typeof card.last4 === "string" ? card.last4 : null;
      return {
        type,
        brand: card ? asText(card.type) : null,
        last4: last4 !== null && /^\d{4}$/.test(last4) ? last4 : null,
        expiry_month: month !== null && month >= 1 && month <= 12 ? month : null,
        expiry_year: year !== null && year >= 2000 && year <= 2200 ? year : null,
      };
    }
  }
  return null;
}

/** Paddle's hosted page for changing the payment method, or null (the subscription has ended). */
export function readUpdateUrl(subscription: unknown): string | null {
  if (!isRecord(subscription) || !isRecord(subscription.management_urls)) return null;
  const url = subscription.management_urls.update_payment_method;
  if (typeof url !== "string") return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export async function handleBillingInfo(req: BillingInfoRequest, deps: BillingInfoDeps): Promise<BillingInfoResponse> {
  const cors = corsHeaders(req.origin, deps.allowedOrigins);

  if (req.method === "OPTIONS") return reply(204, cors);
  if (req.method !== "POST") return reply(405, cors, { error: "Method not allowed." });

  const token = bearerToken(req.authorization);
  if (!token) return reply(401, cors, { error: "Sign in again." });

  // 2. Who is this, which gym, and are they its admin?
  let caller: Caller | null;
  try {
    caller = await deps.getCaller(token);
  } catch (err) {
    deps.log("could not resolve the caller", err);
    return reply(401, cors, { error: "Sign in again." });
  }
  if (!caller) return reply(401, cors, { error: "Sign in again." });
  if (!caller.is_admin) return reply(403, cors, { error: "Only a workspace admin can see billing details." });

  // 3. Input + rate limit.
  if (req.bodyText.length > MAX_BODY_BYTES) return reply(413, cors, { error: "Request too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return reply(400, cors, { error: "Send a JSON object." });
  }
  const action = parseAction(raw);
  if (!action) return reply(400, cors, { error: "Choose overview or invoice." });

  try {
    if (!(await deps.rateLimit(`paddle-billing-info:${action.action}:${caller.tenant_id}`, action.action === "overview" ? 60 : 30))) {
      return reply(429, cors, { error: "Too many requests. Try again in a few minutes." });
    }
  } catch (err) {
    // A broken limiter must not block a verified admin.
    deps.log("rate limit check failed", err);
  }

  // 4. The stored Paddle subscription is the only thing that scopes the reads.
  let sub: StoredSubscription | null;
  try {
    sub = await deps.loadSubscription(caller.tenant_id);
  } catch (err) {
    deps.log("loadSubscription failed", err);
    return reply(500, cors, { error: "Could not load your subscription." });
  }
  if (!sub || sub.payment_provider !== "paddle" || !sub.payment_reference) {
    return reply(409, cors, { error: "Your plan is not billed through a subscription, so there are no card or invoices to show." });
  }
  if (!deps.paddleConfigured) {
    deps.log("billing is not configured (PADDLE_API_KEY)");
    return reply(503, cors, { error: "Billing details are not available yet. Contact support." });
  }
  const subscriptionId = sub.payment_reference;

  // 5b. One invoice link - only for a transaction of THIS subscription.
  if (action.action === "invoice") {
    const txn = await deps.getTransaction(action.transactionId);
    if (!txn.ok) {
      deps.log("could not read the transaction", txn);
      return reply(txn.status === 404 ? 404 : 502, cors, { error: "Could not find that invoice." });
    }
    if (!isRecord(txn.data) || txn.data.subscription_id !== subscriptionId) {
      // Same answer as a missing one: do not confirm that another gym's transaction exists.
      return reply(404, cors, { error: "Could not find that invoice." });
    }
    const invoice = readInvoice(txn.data);
    if (!invoice?.can_download) return reply(409, cors, { error: "This invoice is not available to download." });

    const link = await deps.getInvoiceUrl(action.transactionId);
    const url = link.ok && isRecord(link.data) && typeof link.data.url === "string" ? link.data.url : null;
    if (!url) {
      deps.log("could not get the invoice PDF link", link);
      return reply(502, cors, { error: "Could not prepare the invoice. Try again." });
    }
    return reply(200, cors, { url });
  }

  // 5a. Overview.
  const [subscription, transactions] = await Promise.all([deps.getSubscription(subscriptionId), deps.listTransactions(subscriptionId)]);
  if (!subscription.ok && !transactions.ok) {
    deps.log("could not read billing", { subscription, transactions });
    return reply(502, cors, { error: "Could not reach billing. Try again." });
  }
  const txns = transactions.ok && Array.isArray(transactions.data) ? transactions.data : [];
  return reply(200, cors, {
    payment_method: readPaymentMethod(txns),
    update_payment_method_url: subscription.ok ? readUpdateUrl(subscription.data) : null,
    invoices: txns.map(readInvoice).filter((i): i is Invoice => i !== null),
    // false = the invoice list could not be loaded, so an empty list does not mean "no invoices".
    invoices_available: transactions.ok,
  });
}
