import { supabase } from "../supabaseClient";
import { DEFAULT_CURRENCY } from "../config/runtimeConfig";
import { resolveInvoiceGrossAmount } from "../utils/invoiceMath";

// Revenue sources this module reports on, per the finance module spec:
// product sales, club membership subscriptions, physical training /
// session-based subscriptions, and a catch-all for anything else.
export type FinanceRevenueSourceKey =
  | "product_sales"
  | "membership"
  | "training_sessions"
  | "other";

export const FINANCE_SOURCE_LABELS: Record<FinanceRevenueSourceKey, string> = {
  product_sales: "Product sales (POS)",
  membership: "Club membership subscriptions",
  training_sessions: "Physical training / sessions",
  other: "Other revenue",
};

export interface FinanceRevenueSource {
  key: FinanceRevenueSourceKey;
  label: string;
  amount: number;
}

export interface FinanceExpenseCategory {
  category: string;
  amount: number;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  kind: "revenue" | "expense";
  source: string;
  description: string;
  amount: number;
}

export interface FinanceSummary {
  currency: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueBySource: FinanceRevenueSource[];
  expensesByCategory: FinanceExpenseCategory[];
  transactions: FinanceTransaction[];
}

// Invoice `type` is meant to be one of the DB CHECK constraint's lowercase
// values ('membership', 'class', 'personal_training', 'product', 'other'),
// but some invoice-creation UI in this app writes a different, capitalized
// taxonomy ("Membership", "PT", "Class", "Facility", "Other"). Normalize
// defensively so revenue buckets stay correct regardless of which one wrote
// a given row.
function normalizeInvoiceType(type: string | null | undefined): FinanceRevenueSourceKey {
  const value = (type || "").trim().toLowerCase();
  if (value === "membership") return "membership";
  if (value === "class" || value === "personal_training" || value === "pt") return "training_sessions";
  if (value === "product" || value === "facility") return "product_sales";
  return "other";
}

interface InvoiceRow {
  id: string;
  type: string | null;
  status: string | null;
  total: number | string | null;
  amount: number | string | null;
  paid_date: string | null;
  issue_date: string | null;
  created_at: string | null;
  title?: string | null;
  invoice_number?: string | null;
}

function invoiceDate(invoice: Pick<InvoiceRow, "paid_date" | "issue_date" | "created_at">): string {
  return (invoice.paid_date || invoice.issue_date || invoice.created_at || "").slice(0, 10);
}

export async function getFinanceSummary(
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<FinanceSummary> {
  const [settingsResult, invoicesResult, posResult, expensesResult] = await Promise.all([
    supabase.from("gym_settings").select("currency").eq("tenant_id", tenantId).maybeSingle(),
    supabase
      .from("invoices")
      .select("id, type, status, total, amount, paid_date, issue_date, created_at, title, invoice_number")
      .eq("tenant_id", tenantId)
      .eq("status", "paid"),
    supabase
      .from("pos_sales")
      .select("id, total, created_at, status, sale_number")
      .eq("tenant_id", tenantId)
      .neq("status", "voided")
      .gte("created_at", startDate)
      .lte("created_at", `${endDate}T23:59:59.999Z`),
    supabase
      .from("expenses")
      .select("id, title, category, amount, date, status")
      .eq("tenant_id", tenantId)
      .neq("status", "rejected")
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  if (invoicesResult.error) throw new Error(invoicesResult.error.message || "Unable to load invoices.");
  if (posResult.error) throw new Error(posResult.error.message || "Unable to load POS sales.");
  if (expensesResult.error) throw new Error(expensesResult.error.message || "Unable to load expenses.");

  const currency = settingsResult.data?.currency || DEFAULT_CURRENCY;

  const sourceTotals: Record<FinanceRevenueSourceKey, number> = {
    product_sales: 0,
    membership: 0,
    training_sessions: 0,
    other: 0,
  };
  const transactions: FinanceTransaction[] = [];

  for (const sale of posResult.data ?? []) {
    const amount = Number(sale.total ?? 0);
    sourceTotals.product_sales += amount;
    transactions.push({
      id: `pos-${sale.id}`,
      date: String(sale.created_at ?? "").slice(0, 10),
      kind: "revenue",
      source: FINANCE_SOURCE_LABELS.product_sales,
      description: sale.sale_number ? `POS sale ${sale.sale_number}` : "POS sale",
      amount,
    });
  }

  const invoicesInRange = ((invoicesResult.data ?? []) as InvoiceRow[]).filter((invoice) => {
    const date = invoiceDate(invoice);
    return date >= startDate && date <= endDate;
  });

  for (const invoice of invoicesInRange) {
    const amount = resolveInvoiceGrossAmount(invoice);
    const key = normalizeInvoiceType(invoice.type);
    sourceTotals[key] += amount;
    transactions.push({
      id: `inv-${invoice.id}`,
      date: invoiceDate(invoice),
      kind: "revenue",
      source: FINANCE_SOURCE_LABELS[key],
      description: invoice.invoice_number || invoice.title || "Invoice",
      amount,
    });
  }

  const revenueBySource: FinanceRevenueSource[] = (
    Object.keys(sourceTotals) as FinanceRevenueSourceKey[]
  ).map((key) => ({ key, label: FINANCE_SOURCE_LABELS[key], amount: sourceTotals[key] }));

  const expenseTotals = new Map<string, number>();
  for (const expense of expensesResult.data ?? []) {
    const amount = Number(expense.amount ?? 0);
    const category = expense.category || "Other";
    expenseTotals.set(category, (expenseTotals.get(category) ?? 0) + amount);
    transactions.push({
      id: `exp-${expense.id}`,
      date: String(expense.date ?? "").slice(0, 10),
      kind: "expense",
      source: category,
      description: expense.title || category,
      amount,
    });
  }
  const expensesByCategory: FinanceExpenseCategory[] = Array.from(expenseTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const totalRevenue = revenueBySource.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expensesByCategory.reduce((sum, entry) => sum + entry.amount, 0);

  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    currency,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    revenueBySource,
    expensesByCategory,
    transactions,
  };
}
