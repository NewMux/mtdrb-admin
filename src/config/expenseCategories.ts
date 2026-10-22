// The expense categories every gym starts with, and the rules for the ones an
// owner adds (Settings > Business & tax). A category is stored on an expense as
// plain text (expenses.category), so a custom one needs no schema change.

export const BUILT_IN_EXPENSE_CATEGORIES = [
  "Salaries",
  "Rent",
  "Utilities",
  "Equipment",
  "Cleaning",
  "Subscriptions",
  "Marketing",
  "Insurance",
  "Maintenance",
  "Software",
  "Office Supplies",
  "Other",
] as const;

export const MAX_EXPENSE_CATEGORIES = 30;
export const MAX_EXPENSE_CATEGORY_LENGTH = 40;

const same = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

export const isBuiltInExpenseCategory = (name: string): boolean =>
  BUILT_IN_EXPENSE_CATEGORIES.some((builtIn) => same(builtIn, name));

/** What is stored: trimmed, no blanks, no repeats (case-insensitive), capped. */
export function cleanExpenseCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const name = item.trim().replace(/\s+/g, " ");
    if (!name || name.length > MAX_EXPENSE_CATEGORY_LENGTH) continue;
    if (isBuiltInExpenseCategory(name) || out.some((o) => same(o, name))) continue;
    out.push(name);
    if (out.length >= MAX_EXPENSE_CATEGORIES) break;
  }
  return out;
}

export type ExpenseCategoryError = "category_count" | "category_empty" | "category_too_long" | "category_duplicate";

/** The first problem with a list the owner typed, or null. Checked before saving. */
export function validateExpenseCategories(names: readonly string[]): ExpenseCategoryError | null {
  if (names.length > MAX_EXPENSE_CATEGORIES) return "category_count";
  for (let i = 0; i < names.length; i++) {
    const name = names[i].trim();
    if (!name) return "category_empty";
    if (name.length > MAX_EXPENSE_CATEGORY_LENGTH) return "category_too_long";
    if (isBuiltInExpenseCategory(name) || names.slice(0, i).some((earlier) => same(earlier, name))) {
      return "category_duplicate";
    }
  }
  return null;
}
