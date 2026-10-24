import { describe, it, expect } from "vitest";
import { buildChecklist, checklistProgress, nextChecklistItem, checklistDismissKey } from "./setupChecklist";

const empty = { configured: false, plans: 0, members: 0, classes: 0, invoices: 0 };

describe("setup checklist", () => {
  it("starts with nothing done and points at configuring the gym first", () => {
    const items = buildChecklist(empty);
    expect(items.map((i) => i.id)).toEqual(["configure", "plan", "member", "class", "invoice"]);
    expect(items.every((i) => !i.done)).toBe(true);
    expect(checklistProgress(items)).toEqual({ done: 0, total: 5, complete: false });
    expect(nextChecklistItem(items)?.id).toBe("configure");
  });

  it("derives each item from real counts", () => {
    const items = buildChecklist({ configured: true, plans: 2, members: 0, classes: 1, invoices: 0 });
    expect(Object.fromEntries(items.map((i) => [i.id, i.done]))).toEqual({
      configure: true,
      plan: true,
      member: false,
      class: true,
      invoice: false,
    });
    expect(nextChecklistItem(items)?.id).toBe("member");
  });

  it("is complete only when everything is done, and then has no next step", () => {
    const items = buildChecklist({ configured: true, plans: 1, members: 1, classes: 1, invoices: 1 });
    expect(checklistProgress(items)).toEqual({ done: 5, total: 5, complete: true });
    expect(nextChecklistItem(items)).toBeNull();
  });

  it("links every item to an in-app route", () => {
    for (const item of buildChecklist(empty)) expect(item.to.startsWith("/dashboard/")).toBe(true);
  });

  it("keys the dismissal per gym", () => {
    expect(checklistDismissKey("a")).not.toBe(checklistDismissKey("b"));
  });
});
