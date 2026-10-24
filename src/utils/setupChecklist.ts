// The "get set up" checklist shown on a new gym's dashboard. Every item is
// derived from real data (never a stored tick-box), so it can't drift from
// what the gym has actually done.

export type ChecklistItemId = "configure" | "plan" | "member" | "class" | "invoice";

export interface ChecklistInput {
  /** The owner has saved Settings > Business & tax (or finished the wizard) */
  configured: boolean;
  plans: number;
  members: number;
  classes: number;
  invoices: number;
}

export interface ChecklistItem {
  id: ChecklistItemId;
  done: boolean;
  /** In-app route that does the thing */
  to: string;
}

export function buildChecklist(input: ChecklistInput): ChecklistItem[] {
  return [
    { id: "configure", done: input.configured, to: "/dashboard/settings?tab=business" },
    { id: "plan", done: input.plans > 0, to: "/dashboard/plans" },
    { id: "member", done: input.members > 0, to: "/dashboard/members" },
    { id: "class", done: input.classes > 0, to: "/dashboard/classes" },
    { id: "invoice", done: input.invoices > 0, to: "/dashboard/billing" },
  ];
}

export function checklistProgress(items: readonly ChecklistItem[]): { done: number; total: number; complete: boolean } {
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, complete: done === items.length };
}

/** The first thing still to do, so the card can point at one next step. */
export function nextChecklistItem(items: readonly ChecklistItem[]): ChecklistItem | null {
  return items.find((i) => !i.done) ?? null;
}

export function checklistDismissKey(tenantId: string): string {
  return `mtdrb.setupChecklist.dismissed.${tenantId}`;
}
