import { describe, it, expect } from "vitest";
import {
  normalizeInvoiceStatus,
  isPaidStatus,
  INVOICE_STATUSES,
  PAID_STATUSES,
} from "./invoiceStatus";

describe("normalizeInvoiceStatus", () => {
  it("passes through already-canonical lowercase values", () => {
    for (const status of INVOICE_STATUSES) {
      expect(normalizeInvoiceStatus(status)).toBe(status);
    }
  });

  it("lowercases Title Case values written before the schema was enforced", () => {
    expect(normalizeInvoiceStatus("Paid")).toBe("paid");
    expect(normalizeInvoiceStatus("Overdue")).toBe("overdue");
    expect(normalizeInvoiceStatus("Draft")).toBe("draft");
    expect(normalizeInvoiceStatus("Cancelled")).toBe("cancelled");
  });

  it("maps 'Unpaid'/'unpaid' to the real DB value 'pending'", () => {
    expect(normalizeInvoiceStatus("Unpaid")).toBe("pending");
    expect(normalizeInvoiceStatus("unpaid")).toBe("pending");
  });

  it("maps 'completed'/'complete' to 'paid'", () => {
    expect(normalizeInvoiceStatus("completed")).toBe("paid");
    expect(normalizeInvoiceStatus("Complete")).toBe("paid");
  });

  it("trims whitespace", () => {
    expect(normalizeInvoiceStatus("  paid  ")).toBe("paid");
  });

  it("falls back to 'pending' for null, undefined, empty, or unrecognized values", () => {
    expect(normalizeInvoiceStatus(null)).toBe("pending");
    expect(normalizeInvoiceStatus(undefined)).toBe("pending");
    expect(normalizeInvoiceStatus("")).toBe("pending");
    expect(normalizeInvoiceStatus("garbage")).toBe("pending");
  });
});

describe("isPaidStatus", () => {
  it("is true only for paid (in any recognized casing/alias)", () => {
    expect(isPaidStatus("paid")).toBe(true);
    expect(isPaidStatus("Paid")).toBe(true);
    expect(isPaidStatus("completed")).toBe(true);
  });

  it("is false for every other status", () => {
    expect(isPaidStatus("pending")).toBe(false);
    expect(isPaidStatus("Unpaid")).toBe(false);
    expect(isPaidStatus("overdue")).toBe(false);
    expect(isPaidStatus("draft")).toBe(false);
    expect(isPaidStatus("cancelled")).toBe(false);
    expect(isPaidStatus(null)).toBe(false);
  });
});

describe("PAID_STATUSES", () => {
  it("only contains the canonical 'paid' value", () => {
    expect(PAID_STATUSES).toEqual(["paid"]);
  });
});
