import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useRTL } from "../hooks/useRTL";
import {
  getFinanceSummary,
  type FinanceSummary,
  type FinanceTransaction,
} from "../services/financeService";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

type DateRangeKey = "this-month" | "last-month" | "last-3-months" | "this-year" | "custom";

const toDateString = (date: Date) => date.toISOString().split("T")[0];

const resolveDateRange = (rangeKey: DateRangeKey, customStart: string, customEnd: string) => {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (rangeKey) {
    case "last-month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end.setFullYear(now.getFullYear(), now.getMonth(), 0);
      break;
    case "last-3-months":
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case "this-year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      return {
        start: customStart || toDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: customEnd || toDateString(now),
      };
    case "this-month":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return { start: toDateString(start), end: toDateString(end) };
};

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const KpiCard: React.FC<{
  title: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}> = ({ title, value, tone, icon }) => {
  const toneClasses =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : tone === "negative"
        ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
        : "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${toneClasses}`}>{icon}</div>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h3 className="mb-4 text-sm font-bold text-gray-700 dark:text-gray-200">{title}</h3>
    {children}
  </div>
);

export default function Finance() {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { tenantId } = useAuth();

  const [dateRangeKey, setDateRangeKey] = React.useState<DateRangeKey>("this-month");
  const [customStart, setCustomStart] = React.useState("");
  const [customEnd, setCustomEnd] = React.useState("");
  const [summary, setSummary] = React.useState<FinanceSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [kindFilter, setKindFilter] = React.useState<"all" | "revenue" | "expense">("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");

  const { start, end } = resolveDateRange(dateRangeKey, customStart, customEnd);

  const load = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getFinanceSummary(tenantId, start, end);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("finance.loadFailed"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, start, end]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const currency = summary?.currency ?? "";
  const sourceOptions = React.useMemo(() => {
    if (!summary) return [];
    const revenueSources = summary.revenueBySource.map((entry) => entry.label);
    const expenseCategories = summary.expensesByCategory.map((entry) => entry.category);
    return Array.from(new Set([...revenueSources, ...expenseCategories]));
  }, [summary]);

  const filteredTransactions: FinanceTransaction[] = React.useMemo(() => {
    if (!summary) return [];
    return summary.transactions.filter((transaction) => {
      const matchesKind = kindFilter === "all" || transaction.kind === kindFilter;
      const matchesSource = sourceFilter === "all" || transaction.source === sourceFilter;
      return matchesKind && matchesSource;
    });
  }, [summary, kindFilter, sourceFilter]);

  const revenueChartData = summary?.revenueBySource.filter((entry) => entry.amount > 0) ?? [];
  const expenseChartData = summary?.expensesByCategory ?? [];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finance.title")}</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{t("finance.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dateRangeKey}
              onChange={(event) => setDateRangeKey(event.target.value as DateRangeKey)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              aria-label={t("finance.dateRange")}
            >
              <option value="this-month">{t("finance.thisMonth")}</option>
              <option value="last-month">{t("finance.lastMonth")}</option>
              <option value="last-3-months">{t("finance.last3Months")}</option>
              <option value="this-year">{t("finance.thisYear")}</option>
              <option value="custom">{t("finance.custom")}</option>
            </select>
            {dateRangeKey === "custom" && (
              <>
                <input
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                  aria-label={t("finance.startDate")}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  aria-label={t("finance.endDate")}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </>
            )}
            <button
              type="button"
              onClick={() => void load()}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {t("finance.loadFailed", { defaultValue: "Loading…" })}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title={t("finance.totalRevenue")}
              value={formatMoney(summary.totalRevenue, currency)}
              tone="positive"
              icon={<FiTrendingUp className="h-5 w-5" />}
            />
            <KpiCard
              title={t("finance.totalExpenses")}
              value={formatMoney(summary.totalExpenses, currency)}
              tone="negative"
              icon={<FiTrendingDown className="h-5 w-5" />}
            />
            <KpiCard
              title={t("finance.netProfit")}
              value={formatMoney(summary.netProfit, currency)}
              tone={summary.netProfit >= 0 ? "positive" : "negative"}
              icon={<FiDollarSign className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t("finance.revenueBySource")}>
              {revenueChartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">{t("finance.noData")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={revenueChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="amount"
                      nameKey="label"
                      label={({ label, amount }) => `${label}: ${formatMoney(amount, currency)}`}
                    >
                      {revenueChartData.map((entry, index) => (
                        <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatMoney(value, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={t("finance.expensesByCategory")}>
              {expenseChartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">{t("finance.noData")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={expenseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatMoney(value, currency)} />
                    <Bar dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{t("finance.transactions")}</h3>
              <div className="flex flex-wrap gap-2">
                <select
                  value={kindFilter}
                  onChange={(event) => setKindFilter(event.target.value as "all" | "revenue" | "expense")}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">{t("finance.allTypes")}</option>
                  <option value="revenue">{t("finance.revenueOnly")}</option>
                  <option value="expense">{t("finance.expensesOnly")}</option>
                </select>
                <select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">{t("finance.allCategories")}</option>
                  {sourceOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-700">
                  <tr>
                    <th className="py-2 pe-4 font-bold">{t("finance.date")}</th>
                    <th className="py-2 pe-4 font-bold">{t("finance.source")}</th>
                    <th className="py-2 pe-4 font-bold">{t("finance.description")}</th>
                    <th className="py-2 pe-4 text-end font-bold">{t("finance.amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-2 pe-4 text-gray-500">{transaction.date}</td>
                      <td className="py-2 pe-4 text-gray-700 dark:text-gray-300">{transaction.source}</td>
                      <td className="py-2 pe-4 text-gray-700 dark:text-gray-300">{transaction.description}</td>
                      <td
                        className={`py-2 pe-4 text-end font-semibold ${transaction.kind === "revenue" ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {transaction.kind === "expense" ? "-" : ""}
                        {formatMoney(transaction.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">{t("finance.noTransactions")}</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
