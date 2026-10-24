import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleBillingInfo, parseAction, readPaymentMethod, readUpdateUrl, type BillingInfoDeps, type BillingInfoRequest } from "./handler";

const ORIGIN = "https://app.example.com";
const TXN_A = "txn_01hv8x0aaaaaaaaaaaaaaaaaaa";
const TXN_B = "txn_01hv8x0bbbbbbbbbbbbbbbbbbb";
const TXN_DRAFT = "txn_01hv8x0ccccccccccccccccccc";
const TXN_OTHER = "txn_01hv8x0ddddddddddddddddddd";

const caller = { tenant_id: "tenant-1", is_admin: true };
const sub = { status: "active", payment_provider: "paddle", payment_reference: "sub_1" };

const card = (last4 = "4242", status = "captured") => ({
  status,
  method_details: { type: "card", card: { type: "visa", last4, expiry_month: 4, expiry_year: 2030, cardholder_name: "Secret Name" } },
});
const txn = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  status: "completed",
  subscription_id: "sub_1",
  invoice_number: "1001-10001",
  billed_at: "2026-10-01T09:00:00Z",
  currency_code: "USD",
  details: { totals: { grand_total: "8900", total: "8900", currency_code: "USD" } },
  payments: [card()],
  ...over,
});

function makeDeps(over: Partial<BillingInfoDeps> = {}) {
  const deps = {
    allowedOrigins: [ORIGIN],
    paddleConfigured: true,
    getCaller: vi.fn().mockResolvedValue(caller),
    loadSubscription: vi.fn().mockResolvedValue(sub),
    rateLimit: vi.fn().mockResolvedValue(true),
    getSubscription: vi.fn().mockResolvedValue({
      ok: true,
      data: { management_urls: { update_payment_method: "https://sandbox-pay.paddle.io/update/abc" } },
    }),
    listTransactions: vi.fn().mockResolvedValue({ ok: true, data: [txn(TXN_A), txn(TXN_B, { billed_at: "2026-09-01T09:00:00Z" })] }),
    getTransaction: vi.fn().mockResolvedValue({ ok: true, data: txn(TXN_A) }),
    getInvoiceUrl: vi.fn().mockResolvedValue({ ok: true, data: { url: "https://paddle.example/invoice.pdf" } }),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & BillingInfoDeps;
}

const req = (over: Partial<BillingInfoRequest> = {}, body: unknown = { action: "overview" }): BillingInfoRequest => ({
  method: "POST",
  origin: ORIGIN,
  authorization: "Bearer good.jwt.token",
  bodyText: JSON.stringify(body),
  ...over,
});
const json = (r: { body: string | null }) => JSON.parse(r.body ?? "null");

let deps: ReturnType<typeof makeDeps>;
beforeEach(() => {
  deps = makeDeps();
});

describe("parseAction", () => {
  it("accepts overview, and invoice with a well-formed transaction id", () => {
    expect(parseAction({ action: "overview" })).toEqual({ action: "overview" });
    expect(parseAction({ action: "invoice", transaction_id: TXN_A })).toEqual({ action: "invoice", transactionId: TXN_A });
  });

  it.each([
    [{ action: "invoice" }],
    [{ action: "invoice", transaction_id: "../../customers" }],
    [{ action: "invoice", transaction_id: "sub_1" }],
    [{ action: "invoice", transaction_id: 5 }],
    [{ action: "delete" }],
    [[]],
    [null],
  ])("refuses %j", (raw) => {
    expect(parseAction(raw)).toBeNull();
  });
});

describe("CORS and request shape", () => {
  it("answers the preflight without a token, and only for allowed origins", async () => {
    const ok = await handleBillingInfo(req({ method: "OPTIONS", authorization: null, bodyText: "" }), deps);
    expect(ok.status).toBe(204);
    expect(ok.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    const bad = await handleBillingInfo(req({ method: "OPTIONS", origin: "https://evil.example" }), deps);
    expect(bad.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(deps.getCaller).not.toHaveBeenCalled();
  });

  it("refuses other methods and a missing/odd token without calling anything", async () => {
    expect((await handleBillingInfo(req({ method: "GET" }), deps)).status).toBe(405);
    expect((await handleBillingInfo(req({ authorization: null }), deps)).status).toBe(401);
    expect((await handleBillingInfo(req({ authorization: "Basic x" }), deps)).status).toBe(401);
    expect(deps.getCaller).not.toHaveBeenCalled();
  });

  it("400 for bad JSON or an unknown action, 413 for a huge body, before any billing call", async () => {
    expect((await handleBillingInfo(req({ bodyText: "{nope" }), deps)).status).toBe(400);
    expect((await handleBillingInfo(req({}, { action: "delete" }), deps)).status).toBe(400);
    expect((await handleBillingInfo(req({ bodyText: " ".repeat(2000) }), deps)).status).toBe(413);
    expect(deps.getSubscription).not.toHaveBeenCalled();
    expect(deps.listTransactions).not.toHaveBeenCalled();
  });
});

describe("who may call it", () => {
  it("401 when the token does not resolve to a gym or resolving throws", async () => {
    deps = makeDeps({ getCaller: vi.fn().mockResolvedValue(null) });
    expect((await handleBillingInfo(req(), deps)).status).toBe(401);
    deps = makeDeps({ getCaller: vi.fn().mockRejectedValue(new Error("JWT expired")) });
    expect((await handleBillingInfo(req(), deps)).status).toBe(401);
    expect(deps.listTransactions).not.toHaveBeenCalled();
  });

  it("403 for a signed-in member who is not an admin: card details never leave", async () => {
    deps = makeDeps({ getCaller: vi.fn().mockResolvedValue({ ...caller, is_admin: false }) });
    const r = await handleBillingInfo(req(), deps);
    expect(r.status).toBe(403);
    expect(deps.loadSubscription).not.toHaveBeenCalled();
    expect(deps.listTransactions).not.toHaveBeenCalled();
  });

  it("reads the caller's own subscription whatever the body says", async () => {
    await handleBillingInfo(req({}, { action: "overview", tenant_id: "someone-else", subscription_id: "sub_other" }), deps);
    expect(deps.loadSubscription).toHaveBeenCalledWith("tenant-1");
    expect(deps.getSubscription).toHaveBeenCalledWith("sub_1");
    expect(deps.listTransactions).toHaveBeenCalledWith("sub_1");
  });

  it("429 when rate limited, and carries on if the limiter itself is down", async () => {
    deps = makeDeps({ rateLimit: vi.fn().mockResolvedValue(false) });
    expect((await handleBillingInfo(req(), deps)).status).toBe(429);
    expect(deps.listTransactions).not.toHaveBeenCalled();
    deps = makeDeps({ rateLimit: vi.fn().mockRejectedValue(new Error("db down")) });
    expect((await handleBillingInfo(req(), deps)).status).toBe(200);
  });
});

describe("which gyms have billing details", () => {
  it.each([
    ["no subscription row", null],
    ["a manual grant", { ...sub, payment_provider: "manual", payment_reference: null }],
    ["a missing Paddle reference", { ...sub, payment_reference: null }],
  ])("409 for %s, with no Paddle call", async (_label, stored) => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue(stored) });
    expect((await handleBillingInfo(req(), deps)).status).toBe(409);
    expect(deps.listTransactions).not.toHaveBeenCalled();
  });

  it("503 when billing is not configured", async () => {
    deps = makeDeps({ paddleConfigured: false });
    expect((await handleBillingInfo(req(), deps)).status).toBe(503);
    expect(deps.listTransactions).not.toHaveBeenCalled();
  });

  it("a gym whose payment failed (past_due) can still see its card and fix it", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue({ ...sub, status: "past_due" }) });
    expect((await handleBillingInfo(req(), deps)).status).toBe(200);
  });
});

describe("overview", () => {
  it("returns the card, the update link and the invoices - and nothing else", async () => {
    const r = await handleBillingInfo(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({
      payment_method: { type: "card", brand: "visa", last4: "4242", expiry_month: 4, expiry_year: 2030 },
      update_payment_method_url: "https://sandbox-pay.paddle.io/update/abc",
      invoices: [
        { id: TXN_A, number: "1001-10001", billed_at: "2026-10-01T09:00:00.000Z", status: "completed", total: { amount: 89, currency: "USD" }, can_download: true },
        { id: TXN_B, number: "1001-10001", billed_at: "2026-09-01T09:00:00.000Z", status: "completed", total: { amount: 89, currency: "USD" }, can_download: true },
      ],
      invoices_available: true,
    });
    expect(r.body).not.toContain("Secret Name");
  });

  it("shows only invoices a customer would recognise, and only the completed, non-zero ones can be downloaded", async () => {
    deps = makeDeps({
      listTransactions: vi.fn().mockResolvedValue({
        ok: true,
        data: [
          txn(TXN_DRAFT, { status: "draft" }),
          txn(TXN_OTHER, { status: "canceled" }),
          txn(TXN_B, { status: "past_due" }),
          txn(TXN_A, { details: { totals: { grand_total: "0", currency_code: "USD" } } }),
        ],
      }),
    });
    const body = json(await handleBillingInfo(req(), deps));
    expect(body.invoices.map((i: { id: string }) => i.id)).toEqual([TXN_B, TXN_A]);
    expect(body.invoices.map((i: { can_download: boolean }) => i.can_download)).toEqual([false, false]);
  });

  it("uses the three-decimal minor unit of currencies like BHD", async () => {
    deps = makeDeps({
      listTransactions: vi.fn().mockResolvedValue({ ok: true, data: [txn(TXN_A, { details: { totals: { grand_total: "33500", currency_code: "BHD" } } })] }),
    });
    expect(json(await handleBillingInfo(req(), deps)).invoices[0].total).toEqual({ amount: 33.5, currency: "BHD" });
  });

  it("still answers when only the invoice list fails, and says the list is unavailable", async () => {
    deps = makeDeps({ listTransactions: vi.fn().mockResolvedValue({ ok: false, status: 500, detail: "{}" }) });
    const body = json(await handleBillingInfo(req(), deps));
    expect(body).toMatchObject({ payment_method: null, invoices: [], invoices_available: false });
    expect(body.update_payment_method_url).toContain("https://");
  });

  it("still answers when only the subscription read fails", async () => {
    deps = makeDeps({ getSubscription: vi.fn().mockResolvedValue({ ok: false, status: 500, detail: "{}" }) });
    const body = json(await handleBillingInfo(req(), deps));
    expect(body.update_payment_method_url).toBeNull();
    expect(body.payment_method).not.toBeNull();
  });

  it("502 when billing cannot be reached at all", async () => {
    deps = makeDeps({
      getSubscription: vi.fn().mockResolvedValue({ ok: false, status: 0, detail: "timeout" }),
      listTransactions: vi.fn().mockResolvedValue({ ok: false, status: 0, detail: "timeout" }),
    });
    expect((await handleBillingInfo(req(), deps)).status).toBe(502);
  });
});

describe("readPaymentMethod", () => {
  it("takes the newest captured payment and skips failed attempts", () => {
    const method = readPaymentMethod([
      txn(TXN_A, { payments: [card("1111", "captured"), card("2222", "error")] }),
      txn(TXN_B, { payments: [card("3333")] }),
    ]);
    // Within a transaction the last attempt is newest, but a failed one is skipped.
    expect(method?.last4).toBe("1111");
  });

  it("looks further back when the newest transaction has no captured payment", () => {
    expect(readPaymentMethod([txn(TXN_A, { payments: [] }), txn(TXN_B, { payments: [card("3333")] })])?.last4).toBe("3333");
  });

  it("returns a non-card method without card details", () => {
    expect(readPaymentMethod([txn(TXN_A, { payments: [{ status: "captured", method_details: { type: "paypal" } }] })])).toEqual({
      type: "paypal",
      brand: null,
      last4: null,
      expiry_month: null,
      expiry_year: null,
    });
  });

  it("drops digits that are not four digits and expiry dates that are not dates", () => {
    const method = readPaymentMethod([
      txn(TXN_A, { payments: [{ status: "captured", method_details: { type: "card", card: { type: "visa", last4: "42424242", expiry_month: 13, expiry_year: 20 } } }] }),
    ]);
    expect(method).toMatchObject({ last4: null, expiry_month: null, expiry_year: null });
  });

  it("returns null when nothing was ever captured", () => {
    expect(readPaymentMethod([])).toBeNull();
    expect(readPaymentMethod([txn(TXN_A, { payments: [card("4242", "error")] })])).toBeNull();
  });
});

describe("readUpdateUrl", () => {
  it("only passes on an https link", () => {
    expect(readUpdateUrl({ management_urls: { update_payment_method: "https://pay.paddle.io/x" } })).toBe("https://pay.paddle.io/x");
    expect(readUpdateUrl({ management_urls: { update_payment_method: "javascript:alert(1)" } })).toBeNull();
    expect(readUpdateUrl({ management_urls: { update_payment_method: "http://pay.paddle.io/x" } })).toBeNull();
    expect(readUpdateUrl({ management_urls: {} })).toBeNull();
    expect(readUpdateUrl(null)).toBeNull();
  });
});

describe("invoice download", () => {
  const invoice = (id = TXN_A) => handleBillingInfo(req({}, { action: "invoice", transaction_id: id }), deps);

  it("returns the PDF link for an invoice of this subscription", async () => {
    const r = await invoice();
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ url: "https://paddle.example/invoice.pdf" });
    expect(deps.getTransaction).toHaveBeenCalledWith(TXN_A);
    expect(deps.getInvoiceUrl).toHaveBeenCalledWith(TXN_A);
  });

  it("refuses a transaction that belongs to another subscription, saying the same as for a missing one", async () => {
    deps = makeDeps({ getTransaction: vi.fn().mockResolvedValue({ ok: true, data: txn(TXN_OTHER, { subscription_id: "sub_of_another_gym" }) }) });
    const r = await invoice(TXN_OTHER);
    expect(r.status).toBe(404);
    expect(deps.getInvoiceUrl).not.toHaveBeenCalled();

    deps = makeDeps({ getTransaction: vi.fn().mockResolvedValue({ ok: false, status: 404, detail: "{}" }) });
    const missing = await invoice(TXN_OTHER);
    expect(missing.status).toBe(404);
    expect(json(missing)).toEqual(json(r));
  });

  it("refuses a one-off transaction with no subscription", async () => {
    deps = makeDeps({ getTransaction: vi.fn().mockResolvedValue({ ok: true, data: txn(TXN_A, { subscription_id: null }) }) });
    expect((await invoice()).status).toBe(404);
    expect(deps.getInvoiceUrl).not.toHaveBeenCalled();
  });

  it("409 for an invoice Paddle has no PDF for (unpaid, or zero value)", async () => {
    deps = makeDeps({ getTransaction: vi.fn().mockResolvedValue({ ok: true, data: txn(TXN_A, { status: "billed" }) }) });
    expect((await invoice()).status).toBe(409);
    deps = makeDeps({ getTransaction: vi.fn().mockResolvedValue({ ok: true, data: txn(TXN_A, { details: { totals: { grand_total: "0", currency_code: "USD" } } }) }) });
    expect((await invoice()).status).toBe(409);
    expect(deps.getInvoiceUrl).not.toHaveBeenCalled();
  });

  it("502 when billing cannot be read or gives no link", async () => {
    deps = makeDeps({ getTransaction: vi.fn().mockResolvedValue({ ok: false, status: 0, detail: "timeout" }) });
    expect((await invoice()).status).toBe(502);
    deps = makeDeps({ getInvoiceUrl: vi.fn().mockResolvedValue({ ok: true, data: {} }) });
    expect((await invoice()).status).toBe(502);
  });
});
