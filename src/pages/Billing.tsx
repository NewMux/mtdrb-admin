import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiCreditCard,
  FiBarChart2,
  FiSettings,
  FiDownload,
  FiFileText,
  FiShoppingCart,
  FiActivity,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRTL } from "../hooks/useRTL";
import { useTranslation } from "react-i18next";
import SmartVatDashboard from "../components/billing/SmartVatDashboard";
import FinancialInsightsDashboard from "../components/billing/FinancialInsightsDashboard";
import { NewInvoiceModal } from "../components/billing/NewInvoiceModal";
import ExportBillingDataModal from "../components/billing/modals/ExportBillingDataModal";
import AddExpenseModal from "../components/billing/AddExpenseModal";
import AddInvoiceModal from "../components/billing/AddInvoiceModal";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";
import AdvancedFilterModal from "../components/ui/AdvancedFilterModal";
import type { Invoice, Expense } from "../types";

// Using real data from Supabase - no mock data
interface InvoiceRow {
  id: string;
  invoice_number?: string | null;
  members?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  member?: { name?: string | null };
  amount?: string | number | null;
  total?: string | number | null;
  status?: string | null;
  due_date?: string | null;
  created_at?: string | null;
}

interface ExpenseRow {
  id: string;
  expense_number?: string | null;
  category?: string | null;
  amount?: string | number | null;
  date?: string | null;
  created_at?: string | null;
}

interface RecentTransaction {
  id: string;
  invoice_number: string;
  member: { name?: string | null } | null;
  total: number;
  status: "Paid" | "Unpaid" | "Overdue";
  due_date: string;
}

// Adapt a locally-shaped InvoiceRow (as fetched from Supabase) into the
// richer `Invoice` type the shared invoice modal expects. Fields whose DB
// representation doesn't line up with the modal's shape (e.g. lowercase
// status values vs. the modal's Title Case options, or the partial member
// info we have) are left out entirely so the modal's own `|| default`
// fallbacks kick in, rather than passing inaccurate values.
const toInvoiceProp = (row: InvoiceRow): Invoice => ({
  id: row.id,
  invoice_number: row.invoice_number ?? undefined,
  amount: row.amount != null ? Number(row.amount) : undefined,
  total: row.total != null ? Number(row.total) : undefined,
  due_date: row.due_date ?? undefined,
  created_at: row.created_at ?? undefined,
});

// Adapt a locally-shaped ExpenseRow into the fuller `Expense` type the
// shared expense modal expects. Only the fields we actually have from the
// "overview"/"expenses" queries are mapped; the rest are left undefined so
// the modal falls back to its own defaults for a new/edited expense.
const toExpenseProp = (row: ExpenseRow): Expense =>
  ({
    id: row.id,
    category: row.category ?? undefined,
    amount: row.amount != null ? Number(row.amount) : undefined,
    date: row.date ?? row.created_at ?? undefined,
    created_at: row.created_at ?? undefined,
  }) as Expense;

const Billing: React.FC = () => {
  usePageThemeContext();
  const { tenantId } = useAuth();
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("all");
  const [activeModal, setActiveModal] = React.useState<
    | "createInvoice"
    | "addInvoice"
    | "export"
    | "expense"
    | "viewInvoice"
    | "editInvoice"
    | "viewExpense"
    | "editExpense"
    | null
  >(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceRow | null>(null);
  const [selectedExpense, setSelectedExpense] = React.useState<ExpenseRow | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(Date.now());
  const [loading, setLoading] = React.useState(false);
  const [recentTransactions, setRecentTransactions] = React.useState<RecentTransaction[]>([]);
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([]);
  const [expenses, setExpenses] = React.useState<ExpenseRow[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const tenantIdValue = tenantId ?? "";
  const clientOptions = React.useMemo(
    () =>
      invoices
        .map((invoice) => {
          const name = invoice.member?.name?.trim();
          if (!name) return null;
          return { id: invoice.id, name };
        })
        .filter(
          (client): client is { id: string; name: string } => Boolean(client),
        ),
    [invoices],
  );

  // Settings state management
  const [settings, setSettings] = React.useState({
    autoInvoicing: true,
    paymentReminders: true,
    vatEnabled: false,
  });

  const [billingStats, setBillingStats] = React.useState([
    {
      name: "",
      value: "$0",
      change: "",
      icon: FiDollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      name: "",
      value: "$0",
      change: "",
      icon: FiCreditCard,
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: "",
      value: "0",
      change: "",
      icon: FiFileText,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "",
      value: "$0",
      change: "",
      icon: FiShoppingCart,
      color: "from-red-500 to-red-600",
    },
  ]);

  // Initialize billing stats with translations
  React.useEffect(() => {
    setBillingStats([
      {
        name: t("billing.totalRevenue"),
        value: "$0",
        change: t("messages.loading"),
        icon: FiDollarSign,
        color: "from-green-500 to-green-600",
      },
      {
        name: t("billing.pendingPayments"),
        value: "$0",
        change: t("messages.loading"),
        icon: FiCreditCard,
        color: "from-yellow-500 to-orange-500",
      },
      {
        name: t("billing.totalInvoices"),
        value: "0",
        change: t("messages.loading"),
        icon: FiFileText,
        color: "from-blue-500 to-blue-600",
      },
      {
        name: t("billing.expensesLabel"),
        value: "$0",
        change: t("messages.loading"),
        icon: FiShoppingCart,
        color: "from-red-500 to-red-600",
      },
    ]);
  }, [t]);

  const tabs = [
    { id: "overview", name: t("billing.overview"), icon: FiDollarSign },
    { id: "invoices", name: t("billing.invoices"), icon: FiFileText },
    { id: "expenses", name: t("billing.expenses"), icon: FiShoppingCart },
    { id: "analytics", name: t("billing.analytics"), icon: FiBarChart2 },
    { id: "vat", name: t("billing.vatReports"), icon: FiCreditCard },
    { id: "settings", name: t("billing.settings"), icon: FiSettings },
  ];

  const [filters, setFilters] = React.useState([
    { id: "all", name: t("billing.allTransactions"), count: 0 },
    { id: "paid", name: t("billing.paid"), count: 0 },
    { id: "pending", name: t("billing.pending"), count: 0 },
    { id: "overdue", name: t("billing.overdue"), count: 0 },
  ]);


  // Load persisted billing-tab settings for the current tenant.
  React.useEffect(() => {
    if (!tenantId) return;

    const loadBillingSettings = async () => {
      const { data, error } = await supabase
        .from("gym_settings")
        .select("metadata")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) {
        console.error("Failed to load billing settings:", error);
        return;
      }

      const metadata = (data?.metadata ?? {}) as Record<string, unknown>;
      const saved = metadata.billing_settings as Partial<typeof settings> | undefined;
      if (saved) {
        setSettings((previous) => ({ ...previous, ...saved }));
      }
    };

    void loadBillingSettings();
  }, [tenantId]);

  // Fetch billing data
  React.useEffect(() => {
    const fetchBillingData = async () => {
      if (!tenantId) return;
      
      try {
        setLoading(true);
        const now = new Date();
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Fetch invoices
        const { data: allInvoices, error: invoicesError } = await supabase
          .from("invoices")
          .select("*, members(id, first_name, last_name, email)")
          .eq("tenant_id", tenantId);

        if (invoicesError) throw invoicesError;

        // Fetch expenses
        const { data: allExpenses, error: expensesError } = await supabase
          .from("expenses")
          .select("*")
          .eq("tenant_id", tenantId);

        if (expensesError) throw expensesError;

        const invoiceRows = (allInvoices ?? []) as InvoiceRow[];
        const mappedInvoices = invoiceRows.map((invoice) => {
          const memberRecord = invoice.members;
          const memberName = memberRecord
            ? `${memberRecord.first_name ?? ""} ${memberRecord.last_name ?? ""}`
                .trim() || memberRecord.email || "Member"
            : undefined;
          return {
            ...invoice,
            member: memberName ? { name: memberName } : undefined,
          };
        });
        setInvoices(mappedInvoices);
        setExpenses((allExpenses ?? []) as ExpenseRow[]);

        // Calculate total revenue (from paid invoices)
        const paidInvoices = (allInvoices || []).filter(inv => 
          inv.status === "paid" || inv.status === "completed"
        );
        const totalRevenue = paidInvoices.reduce((sum, inv) => 
          sum + parseFloat(inv.amount || inv.total || "0"), 0
        );

        // Calculate previous month revenue
        const previousMonthInvoices = (allInvoices || []).filter(inv => {
          const invoiceDate = new Date(inv.created_at);
          return invoiceDate >= previousMonthStart && invoiceDate <= previousMonthEnd &&
                 (inv.status === "paid" || inv.status === "completed");
        });
        const previousRevenue = previousMonthInvoices.reduce((sum, inv) => 
          sum + parseFloat(inv.amount || inv.total || "0"), 0
        );
        const revenueChange = previousRevenue > 0 
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
          : 0;

        // Calculate pending payments (unpaid invoices)
        const pendingInvoices = (allInvoices || []).filter(inv => 
          inv.status === "pending" || inv.status === "unpaid"
        );
        const pendingPayments = pendingInvoices.reduce((sum, inv) => 
          sum + parseFloat(inv.amount || inv.total || "0"), 0
        );

        // Calculate previous month pending
        const previousPending = (allInvoices || []).filter(inv => {
          const invoiceDate = new Date(inv.created_at);
          return invoiceDate >= previousMonthStart && invoiceDate <= previousMonthEnd &&
                 (inv.status === "pending" || inv.status === "unpaid");
        }).reduce((sum, inv) => sum + parseFloat(inv.amount || inv.total || "0"), 0);
        const pendingChange = previousPending > 0 
          ? ((pendingPayments - previousPending) / previousPending) * 100 
          : 0;

        // Total invoices
        const totalInvoices = (allInvoices || []).length;
        const previousTotalInvoices = (allInvoices || []).filter(inv => {
          const invoiceDate = new Date(inv.created_at);
          return invoiceDate >= previousMonthStart && invoiceDate <= previousMonthEnd;
        }).length;
        const invoicesChange = previousTotalInvoices > 0 
          ? ((totalInvoices - previousTotalInvoices) / previousTotalInvoices) * 100 
          : 0;

        // Total expenses
        const totalExpenses = (allExpenses || []).reduce((sum, exp) => 
          sum + parseFloat(exp.amount || "0"), 0
        );
        const previousExpenses = (allExpenses || []).filter(exp => {
          const expenseDate = new Date(exp.date || exp.created_at);
          return expenseDate >= previousMonthStart && expenseDate <= previousMonthEnd;
        }).reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);
        const expensesChange = previousExpenses > 0 
          ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
          : 0;

        // Update billing stats
        setBillingStats([
          {
            name: t("billing.totalRevenue"),
            value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            change: revenueChange >= 0 
              ? `+${revenueChange.toFixed(1)}% ${t("billing.fromLastMonth")}` 
              : `${revenueChange.toFixed(1)}% ${t("billing.fromLastMonth")}`,
            icon: FiDollarSign,
            color: "from-green-500 to-green-600",
          },
          {
            name: t("billing.pendingPayments"),
            value: `$${pendingPayments.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            change: pendingChange >= 0 
              ? `+${pendingChange.toFixed(1)}% ${t("billing.fromLastMonth")}` 
              : `${pendingChange.toFixed(1)}% ${t("billing.fromLastMonth")}`,
            icon: FiCreditCard,
            color: "from-yellow-500 to-orange-500",
          },
          {
            name: t("billing.totalInvoices"),
            value: totalInvoices.toLocaleString(),
            change: invoicesChange >= 0 
              ? `+${invoicesChange.toFixed(1)}% ${t("billing.fromLastMonth")}` 
              : `${invoicesChange.toFixed(1)}% ${t("billing.fromLastMonth")}`,
            icon: FiFileText,
            color: "from-blue-500 to-blue-600",
          },
          {
            name: t("billing.expensesLabel"),
            value: `$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            change: expensesChange >= 0 
              ? `+${expensesChange.toFixed(1)}% ${t("billing.fromLastMonth")}` 
              : `${expensesChange.toFixed(1)}% ${t("billing.fromLastMonth")}`,
            icon: FiShoppingCart,
            color: "from-red-500 to-red-600",
          },
        ]);

        // Update filters
        const paidCount = paidInvoices.length;
        const pendingCount = pendingInvoices.length;
        const overdueInvoices = (allInvoices || []).filter(inv => {
          if (inv.status === "paid" || inv.status === "completed") return false;
          if (inv.due_date) {
            return new Date(inv.due_date) < now;
          }
          return false;
        });
        const overdueCount = overdueInvoices.length;

        setFilters([
          { id: "all", name: t("billing.allTransactions"), count: totalInvoices },
          { id: "paid", name: t("billing.paid"), count: paidCount },
          { id: "pending", name: t("billing.pending"), count: pendingCount },
          { id: "overdue", name: t("billing.overdue"), count: overdueCount },
        ]);

        // Fetch recent transactions (last 10 invoices)
        const recentInvoices = (allInvoices || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map((inv): RecentTransaction => ({
            id: inv.id,
            invoice_number: inv.invoice_number || inv.id.substring(0, 8),
            member: inv.members ? {
              name: `${inv.members.first_name || ''} ${inv.members.last_name || ''}`.trim() || inv.members.email
            } : null,
            total: parseFloat(inv.amount || inv.total || "0"),
            status: inv.status === "paid" || inv.status === "completed" ? "Paid"
              : inv.status === "pending" || inv.status === "unpaid" ? "Unpaid"
              : "Overdue",
            due_date: inv.due_date || inv.created_at,
          }));
        
        setRecentTransactions(recentInvoices);
      } catch (error) {
        console.error("Error fetching billing data:", error);
        toast.error(t("billing.failedToLoad"));
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [tenantId, refreshKey, t]);

  // Button handlers
  const handleRefreshData = () => {
    setRefreshKey(Date.now());
    toast.success(t("billing.dataRefreshed"));
  };

  const handleSettingsChange = async (setting: keyof typeof settings) => {
    if (!tenantId) {
      toast.error(t("billing.failedToSave", "Unable to save billing settings"));
      return;
    }

    const nextValue = !settings[setting];
    setSettings((previous) => ({ ...previous, [setting]: nextValue }));

    const { data: currentSettings, error: readError } = await supabase
      .from("gym_settings")
      .select("metadata")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (readError) {
      setSettings((previous) => ({ ...previous, [setting]: !nextValue }));
      toast.error(t("billing.failedToSave", "Unable to save billing settings"));
      return;
    }

    const metadata = (currentSettings?.metadata ?? {}) as Record<string, unknown>;
    const currentBilling = (metadata.billing_settings ?? {}) as Partial<typeof settings>;
    const { error: saveError } = await supabase
      .from("gym_settings")
      .upsert(
        {
          tenant_id: tenantId,
          metadata: {
            ...metadata,
            billing_settings: {
              ...currentBilling,
              [setting]: nextValue,
            },
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" },
      );

    if (saveError) {
      setSettings((previous) => ({ ...previous, [setting]: !nextValue }));
      toast.error(t("billing.failedToSave", "Unable to save billing settings"));
      return;
    }

    toast.success(t("messages.updated"));
  };

  // Table action handlers
  const handleViewInvoice = (invoice: InvoiceRow) => {
    setSelectedInvoice(invoice);
    setActiveModal("viewInvoice");
  };

  const handleEditInvoice = (invoice: InvoiceRow) => {
    setSelectedInvoice(invoice);
    setActiveModal("editInvoice");
  };

  const handleViewExpense = (expense: ExpenseRow) => {
    setSelectedExpense(expense);
    setActiveModal("viewExpense");
  };

  const handleEditExpense = (expense: ExpenseRow) => {
    setSelectedExpense(expense);
    setActiveModal("editExpense");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedInvoice(null);
    setSelectedExpense(null);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {billingStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-start">
                  {t("billing.recentTransactions")}
                </h2>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t("billing.viewAllTransactions")}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.transactionNumber")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.member")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.amount")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.status")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.date")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          {t("billing.loadingTransactions")}
                        </td>
                      </tr>
                    ) : recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          {t("billing.noRecentTransactions")}
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white text-start">
                            {invoice.invoice_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                            {invoice.member?.name || t("billing.nA")}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                            ${invoice.total.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-start">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                invoice.status === "Paid"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                  : invoice.status === "Unpaid"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                              }`}
                            >
                              {invoice.status === "Paid" ? t("billing.paid") : invoice.status === "Unpaid" ? t("billing.unpaid") : t("billing.overdue")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "invoices":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-start">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("billing.invoiceManagement")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("billing.invoiceManagementDesc")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveModal("export")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>{t("billing.export")}</span>
                  </button>
                  <button
                    onClick={() => setActiveModal("addInvoice")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>{t("billing.addInvoice")}</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.invoiceNumber")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.member")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.amount")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.status")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.dueDate")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white text-start">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                          {invoice.member?.name || t("billing.nA")}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                          ${Number(invoice.total ?? invoice.amount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-start">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              (invoice.status ?? "unpaid").toLowerCase() === "paid"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                : (invoice.status ?? "unpaid").toLowerCase() ===
                                    "unpaid"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                            }`}
                          >
                            {(invoice.status ?? "unpaid").toLowerCase() === "paid" 
                              ? t("billing.paid")
                              : (invoice.status ?? "unpaid").toLowerCase() === "unpaid"
                                ? t("billing.unpaid")
                                : t("billing.overdue")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                          {invoice.due_date
                            ? new Date(invoice.due_date).toLocaleDateString()
                            : t("billing.nA")}
                        </td>
                        <td className="py-3 px-4 text-start">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md text-sm font-medium transition-colors cursor-pointer border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600"
                            >
                              {t("billing.view")}
                            </button>
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="px-3 py-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md text-sm font-medium transition-colors cursor-pointer border border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600"
                            >
                              {t("billing.edit")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "expenses":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-start">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("billing.expenseManagement")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("billing.expenseManagementDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal("expense")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>{t("billing.addExpense")}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.expenseNumber")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.category")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.amount")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.date")}
                      </th>
                      <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-start">
                        {t("billing.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white text-start">
                          {expense.expense_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                          {expense.category}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                          ${Number(expense.amount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-start">
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString()
                            : expense.created_at
                              ? new Date(expense.created_at).toLocaleDateString()
                              : t("billing.nA")}
                        </td>
                        <td className="py-3 px-4 text-start">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewExpense(expense)}
                              className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md text-sm font-medium transition-colors cursor-pointer border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600"
                            >
                              {t("billing.view")}
                            </button>
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="px-3 py-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md text-sm font-medium transition-colors cursor-pointer border border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600"
                            >
                              {t("billing.edit")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <FinancialInsightsDashboard refreshKey={refreshKey} />
          </div>
        );

      case "vat":
        return (
          <div className="space-y-6">
            <SmartVatDashboard tenantId={tenantIdValue} refreshKey={refreshKey} />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {t("billing.billingSettings")}
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-start">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t("billing.autoInvoicing")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("billing.autoInvoicingDesc")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingsChange("autoInvoicing")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoInvoicing
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoInvoicing
                          ? isRTL ? "translate-x-[-1.25rem]" : "translate-x-6"
                          : isRTL ? "translate-x-[-0.25rem]" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-start">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t("billing.paymentReminders")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("billing.paymentRemindersDesc")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingsChange("paymentReminders")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.paymentReminders
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.paymentReminders
                          ? isRTL ? "translate-x-[-1.25rem]" : "translate-x-6"
                          : isRTL ? "translate-x-[-0.25rem]" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-start">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t("billing.vatEnabled")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("billing.vatEnabledDesc")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingsChange("vatEnabled")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.vatEnabled
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.vatEnabled 
                          ? isRTL ? "translate-x-[-1.25rem]" : "translate-x-6" 
                          : isRTL ? "translate-x-[-0.25rem]" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("billing.smartBillingManagement")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t("billing.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <FiActivity className="w-4 h-4" />
              <span>{t("billing.refresh")}</span>
            </button>
            <button
              onClick={() => setActiveModal("addInvoice")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>{t("billing.addInvoice")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
            <input
              type="text"
              placeholder={t("billing.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showAdvancedFilters
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Advanced filters"
            >
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === "addInvoice" && (
          <AddInvoiceModal
            isOpen={activeModal === "addInvoice"}
            onClose={closeModal}
            tenantId={tenantId}
            invoice={null}
            onInvoiceAdded={() => {
              closeModal();
              toast.success(t("billing.invoiceCreated"));
            }}
          />
        )}

        {activeModal === "expense" && (
          <AddExpenseModal
            isOpen={activeModal === "expense"}
            onClose={closeModal}
            tenantId={tenantId}
            expense={null}
            onExpenseAdded={() => {
              closeModal();
              toast.success(t("billing.expenseAdded"));
            }}
          />
        )}

        {activeModal === "export" && (
          <ExportBillingDataModal
            open={activeModal === "export"}
            onClose={closeModal}
          />
        )}

        {activeModal === "viewInvoice" && selectedInvoice && (
          <NewInvoiceModal
            isOpen={activeModal === "viewInvoice"}
            onClose={closeModal}
            clients={clientOptions}
            tenantId={tenantIdValue}
            onSave={() => {
              closeModal();
              toast.success(t("billing.invoiceUpdated"));
            }}
            invoice={toInvoiceProp(selectedInvoice)}
          />
        )}

        {activeModal === "editInvoice" && selectedInvoice && (
          <NewInvoiceModal
            isOpen={activeModal === "editInvoice"}
            onClose={closeModal}
            clients={clientOptions}
            tenantId={tenantIdValue}
            onSave={() => {
              closeModal();
              toast.success(t("billing.invoiceUpdated"));
            }}
            invoice={toInvoiceProp(selectedInvoice)}
          />
        )}

        {activeModal === "viewExpense" && selectedExpense && (
          <AddExpenseModal
            isOpen={activeModal === "viewExpense"}
            onClose={closeModal}
            expense={toExpenseProp(selectedExpense)}
            tenantId={tenantId}
            onExpenseAdded={() => {
              closeModal();
              toast.success(t("billing.expenseUpdated"));
            }}
          />
        )}

        {activeModal === "editExpense" && selectedExpense && (
          <AddExpenseModal
            isOpen={activeModal === "editExpense"}
            onClose={closeModal}
            expense={toExpenseProp(selectedExpense)}
            tenantId={tenantId}
            onExpenseAdded={() => {
              closeModal();
              toast.success(t("billing.expenseUpdated"));
            }}
          />
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title={t("billing.advancedFilters")}
        clearLabel={t("billing.clearAllFilters")}
        onClear={() => {
          setSelectedFilter("all");
        }}
      >
        {/* Transaction Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("billing.transactionType")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("billing.allTypes")}</option>
            <option value="invoice">{t("billing.invoices")}</option>
            <option value="expense">{t("billing.expenses")}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("billing.status")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("billing.allStatuses")}</option>
            <option value="paid">{t("billing.paid")}</option>
            <option value="unpaid">{t("billing.unpaid")}</option>
            <option value="pending">{t("billing.pending")}</option>
            <option value="overdue">{t("billing.overdue")}</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("billing.dateFrom")}
          </label>
          <input
            type="date"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("billing.dateTo")}
          </label>
          <input
            type="date"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>

        {/* Amount Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("billing.minimumAmount")}
          </label>
          <input
            type="number"
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("billing.maximumAmount")}
          </label>
          <input
            type="number"
            placeholder="No limit"
            step="0.01"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
      </AdvancedFilterModal>
    </div>
  );
};

export default Billing;
