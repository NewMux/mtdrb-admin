import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(): TrpcContext {
  return { user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("ERP input contracts", () => {
  it("rejects a counter sale with no lines before business processing", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.erp.sales.create({ customerName: "Walk-in", discount: 0, paymentMethod: "cash", paymentStatus: "paid", items: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("rejects malformed customer input before persistence", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.erp.customers.create({ name: "A", phone: "1", email: "invalid-email", address: "", notes: "", preferredContact: "WhatsApp" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
