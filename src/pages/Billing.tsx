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
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiTarget,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import SmartBillingDashboard from "../components/billing/SmartBillingDashboard";
import SmartVatDashboard from "../components/billing/SmartVatDashboard";
import BillingKPICards from "../components/billing/BillingKPICards";
import SmartBillingAnalytics from "../components/billing/SmartBillingAnalytics";
import FinancialInsightsDashboard from "../components/billing/FinancialInsightsDashboard";
import { NewInvoiceModal } from "../components/billing/NewInvoiceModal";
import ExportBillingDataModal from "../components/billing/modals/ExportBillingDataModal";
import AddExpenseModal from "../components/billing/AddExpenseModal";
import AddInvoiceModal from "../components/billing/AddInvoiceModal";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";

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

const Billing: React.FC = () => {
  const { theme } = usePageThemeContext();
  const { tenantId } = useAuth();

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
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);
  const [selectedExpense, setSelectedExpense] = React.useState<any>(null);
  const [refreshKey, setRefreshKey] = React.useState(Date.now());
  const [loading, setLoading] = React.useState(false);
  const [recentTransactions, setRecentTransactions] = React.useState<any[]>([]);
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([]);
  const [expenses, setExpenses] = React.useState<ExpenseRow[]>([]);
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
      name: "Total Revenue",
      value: "$0",
      change: "Loading...",
      icon: FiDollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Pending Payments",
      value: "$0",
      change: "Loading...",
      icon: FiCreditCard,
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: "Total Invoices",
      value: "0",
      change: "Loading...",
      icon: FiFileText,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Expenses",
      value: "$0",
      change: "Loading...",
      icon: FiShoppingCart,
      color: "from-red-500 to-red-600",
    },
  ]);

  const tabs = [
    { id: "overview", name: "Overview", icon: FiDollarSign },
    { id: "invoices", name: "Invoices", icon: FiFileText },
    { id: "expenses", name: "Expenses", icon: FiShoppingCart },
    { id: "analytics", name: "Analytics", icon: FiBarChart2 },
    { id: "vat", name: "VAT Reports", icon: FiCreditCard },
    { id: "settings", name: "Settings", icon: FiSettings },
  ];

  const [filters, setFilters] = React.useState([
    { id: "all", name: "All Transactions", count: 0 },
    { id: "paid", name: "Paid", count: 0 },
    { id: "pending", name: "Pending", count: 0 },
    { id: "overdue", name: "Overdue", count: 0 },
  ]);

  // Fetch billing data
  React.useEffect(() => {
    const fetchBillingData = async () => {
      if (!tenantId) return;
      
      try {
        setLoading(true);
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

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
            name: "Total Revenue",
            value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            change: revenueChange >= 0 
              ? `+${revenueChange.toFixed(1)}% from last month` 
              : `${revenueChange.toFixed(1)}% from last month`,
            icon: FiDollarSign,
            color: "from-green-500 to-green-600",
          },
          {
            name: "Pending Payments",
            value: `$${pendingPayments.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            change: pendingChange >= 0 
              ? `+${pendingChange.toFixed(1)}% from last month` 
              : `${pendingChange.toFixed(1)}% from last month`,
            icon: FiCreditCard,
            color: "from-yellow-500 to-orange-500",
          },
          {
            name: "Total Invoices",
            value: totalInvoices.toLocaleString(),
            change: invoicesChange >= 0 
              ? `+${invoicesChange.toFixed(1)}% from last month` 
              : `${invoicesChange.toFixed(1)}% from last month`,
            icon: FiFileText,
            color: "from-blue-500 to-blue-600",
          },
          {
            name: "Expenses",
            value: `$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            change: expensesChange >= 0 
              ? `+${expensesChange.toFixed(1)}% from last month` 
              : `${expensesChange.toFixed(1)}% from last month`,
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
          { id: "all", name: "All Transactions", count: totalInvoices },
          { id: "paid", name: "Paid", count: paidCount },
          { id: "pending", name: "Pending", count: pendingCount },
          { id: "overdue", name: "Overdue", count: overdueCount },
        ]);

        // Fetch recent transactions (last 10 invoices)
        const recentInvoices = (allInvoices || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map(inv => ({
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
        toast.error("Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [tenantId, refreshKey]);

  // Button handlers
  const handleExportReports = () => {
    toast.success("Reports exported successfully!");
  };

  const handleRefreshData = () => {
    setRefreshKey(Date.now());
    toast.success("Data refreshed!");
  };

  const handleSettingsChange = (setting: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [setting]: !prev[setting] }));
    toast.success(
      `${setting.replace(/([A-Z])/g, " $1").toLowerCase()} setting updated`,
    );
  };

  // Table action handlers
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setActiveModal("viewInvoice");
  };

  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setActiveModal("editInvoice");
  };

  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setActiveModal("viewExpense");
  };

  const handleEditExpense = (expense: any) => {
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
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Transactions
                </h2>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  View All Transactions
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Transaction #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No recent transactions
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((invoice: any) => (
                        <tr
                          key={invoice.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {invoice.member?.name || "N/A"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            ${invoice.total.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                invoice.status === "Paid"
                                  ? "bg-green-100 text-green-800"
                                  : invoice.status === "Unpaid"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Invoice Management
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage all invoices, payments, and billing
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveModal("export")}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => setActiveModal("addInvoice")}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Invoice</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Invoice #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Due Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {invoice.member?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          ${Number(invoice.total ?? invoice.amount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              (invoice.status ?? "unpaid").toLowerCase() === "paid"
                                ? "bg-green-100 text-green-800"
                                : (invoice.status ?? "unpaid").toLowerCase() ===
                                    "unpaid"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {invoice.status ?? "Unpaid"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {invoice.due_date
                            ? new Date(invoice.due_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-green-200 hover:border-green-300"
                            >
                              Edit
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Expense Management
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Track and manage all business expenses
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal("expense")}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Expense #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {expense.expense_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {expense.category}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          ${Number(expense.amount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString()
                            : expense.created_at
                              ? new Date(expense.created_at).toLocaleDateString()
                              : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewExpense(expense)}
                              className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-green-200 hover:border-green-300"
                            >
                              Edit
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Billing Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Auto Invoicing
                    </h3>
                    <p className="text-sm text-gray-600">
                      Automatically generate invoices for recurring payments
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
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Payment Reminders
                    </h3>
                    <p className="text-sm text-gray-600">
                      Send automatic reminders for overdue payments
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
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      VAT Enabled
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enable VAT calculations and reporting
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
                        settings.vatEnabled ? "translate-x-6" : "translate-x-1"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              💰 Smart Billing Management
            </h1>
            <p className="text-gray-600 mt-1">
              Automated invoicing • Payment tracking • VAT compliance
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefreshData}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FiActivity className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setActiveModal("addInvoice")}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search invoices, expenses, or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <button className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              toast.success("Invoice created successfully!");
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
              toast.success("Expense added successfully!");
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
              toast.success("Invoice updated successfully!");
            }}
            invoice={selectedInvoice}
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
              toast.success("Invoice updated successfully!");
            }}
            invoice={selectedInvoice}
          />
        )}

        {activeModal === "viewExpense" && selectedExpense && (
          <AddExpenseModal
            isOpen={activeModal === "viewExpense"}
            onClose={closeModal}
            expense={selectedExpense}
            tenantId={tenantId}
            onExpenseAdded={() => {
              closeModal();
              toast.success("Expense updated successfully!");
            }}
          />
        )}

        {activeModal === "editExpense" && selectedExpense && (
          <AddExpenseModal
            isOpen={activeModal === "editExpense"}
            onClose={closeModal}
            expense={selectedExpense}
            tenantId={tenantId}
            onExpenseAdded={() => {
              closeModal();
              toast.success("Expense updated successfully!");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Billing;
