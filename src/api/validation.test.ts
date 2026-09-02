import { describe, expect, it } from "vitest";
import {
  validateTenantAccess,
  sanitizeInput,
  validateUUID,
  validateInput,
  createInvoiceSchema,
  paginationSchema,
} from "./validation";

describe("validateTenantAccess", () => {
  it("allows access when the tenant ids match", () => {
    expect(validateTenantAccess("tenant-a", "tenant-a")).toBe(true);
  });

  it("denies access when the tenant ids differ", () => {
    // This is the multi-tenant isolation boundary - a false positive here
    // would let one gym's admin read or write another gym's data.
    expect(validateTenantAccess("tenant-a", "tenant-b")).toBe(false);
  });

  it("denies access for an empty resource tenant id", () => {
    expect(validateTenantAccess("tenant-a", "")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(validateTenantAccess("Tenant-A", "tenant-a")).toBe(false);
  });
});

describe("sanitizeInput (api/validation)", () => {
  it("strips HTML tags and trims the result", () => {
    expect(sanitizeInput("  <b>bold</b> text  ")).toBe("bold text");
  });

  it("blocks javascript: URIs", () => {
    expect(sanitizeInput("javascript:alert(1)")).toBe("alert(1)");
  });

  it("blocks data: and vbscript: URIs", () => {
    expect(sanitizeInput("data:text/html,x")).toBe("text/html,x");
    expect(sanitizeInput("vbscript:msgbox(1)")).toBe("msgbox(1)");
  });
});

describe("validateUUID", () => {
  it("accepts a well-formed UUID", () => {
    expect(validateUUID("123e4567-e89b-12d3-a456-426614174000")).toEqual({
      success: true,
    });
  });

  it("rejects a non-UUID string with a labeled error", () => {
    const result = validateUUID("not-a-uuid", "Member ID");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid Member ID format");
  });
});

describe("createInvoiceSchema via validateInput", () => {
  const validInvoice = {
    member_id: "123e4567-e89b-12d3-a456-426614174000",
    amount: 100,
    description: "Monthly membership",
    due_date: "2024-12-31",
  };

  it("accepts a valid invoice payload and defaults status to pending", () => {
    const result = validateInput(createInvoiceSchema, validInvoice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending");
      expect(result.data.amount).toBe(100);
    }
  });

  it("accepts a zero-amount invoice", () => {
    const result = validateInput(createInvoiceSchema, {
      ...validInvoice,
      amount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative invoice amount", () => {
    const result = validateInput(createInvoiceSchema, {
      ...validInvoice,
      amount: -50,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain("Amount cannot be negative");
    }
  });

  it("rejects a payload missing a required field", () => {
    const { due_date: _dueDate, ...withoutDueDate } = validInvoice;
    void _dueDate;
    const result = validateInput(createInvoiceSchema, withoutDueDate);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status enum value", () => {
    const result = validateInput(createInvoiceSchema, {
      ...validInvoice,
      status: "refunded",
    });
    expect(result.success).toBe(false);
  });

  it("returns a generic error array for non-Zod failures", () => {
    // Passing something that isn't even an object should still resolve to
    // the { success: false, errors: [...] } shape, never throw.
    const result = validateInput(createInvoiceSchema, null);
    expect(result.success).toBe(false);
  });
});

describe("paginationSchema via validateInput", () => {
  it("defaults page and limit when omitted", () => {
    const result = validateInput(paginationSchema, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 1, limit: 10 });
    }
  });

  it("rejects a limit above the maximum", () => {
    const result = validateInput(paginationSchema, { page: 1, limit: 500 });
    expect(result.success).toBe(false);
  });

  it("rejects a page below 1", () => {
    const result = validateInput(paginationSchema, { page: 0, limit: 10 });
    expect(result.success).toBe(false);
  });
});
