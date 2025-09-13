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

import { mockInvoices, mockExpenses } from "../api/mockBillingData";

// Mock clients for the invoice modal
const mockClients = [
  {
    id: "member-1",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1111111111",
  },
  {
    id: "member-2",
    name: "John Smith",
    email: "john@example.com",
    phone: "+2222222222",
  },
  {
    id: "member-3",
    name: "Emily Lee",
    email: "emily@example.com",
    phone: "+3333333333",
  },
  {
    id: "member-4",
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+4444444444",
  },
  {
    id: "member-5",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    phone: "+5555555555",
  },
  {
    id: "member-6",
    name: "David Brown",
    email: "david@example.com",
    phone: "+6666666666",
  },
  {
    id: "member-7",
    name: "Lisa Garcia",
    email: "lisa@example.com",
    phone: "+7777777777",
  },
  {
    id: "member-8",
    name: "Tom Anderson",
    email: "tom@example.com",
    phone: "+8888888888",
  },
];

const Billing: React.FC = () => {
  const { theme } = usePageThemeContext();

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

  // Settings state management
  const [settings, setSettings] = React.useState({
    autoInvoicing: true,
    paymentReminders: true,
    vatEnabled: false,
  });

  const billingStats = [
    {
      name: "Total Revenue",
      value: "$124,750",
      change: "+12% from last month",
      icon: FiDollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Pending Payments",
      value: "$8,450",
      change: "+5% from last month",
      icon: FiCreditCard,
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: "Total Invoices",
      value: "1,247",
      change: "+8% from last month",
      icon: FiFileText,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Expenses",
      value: "$15,230",
      change: "-3% from last month",
      icon: FiShoppingCart,
      color: "from-red-500 to-red-600",
    },
  ];

  const tabs = [
    { id: "overview", name: "Overview", icon: FiDollarSign },
    { id: "invoices", name: "Invoices", icon: FiFileText },
    { id: "expenses", name: "Expenses", icon: FiShoppingCart },
    { id: "analytics", name: "Analytics", icon: FiBarChart2 },
    { id: "vat", name: "VAT Reports", icon: FiCreditCard },
    { id: "settings", name: "Settings", icon: FiSettings },
  ];

  const filters = [
    { id: "all", name: "All Transactions", count: 1247 },
    { id: "paid", name: "Paid", count: 1189 },
    { id: "pending", name: "Pending", count: 45 },
    { id: "overdue", name: "Overdue", count: 13 },
  ];

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
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Transactions
                </h2>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View All Transactions
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Transaction #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.slice(0, 5).map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {invoice.member?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          ${invoice.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.status === "Paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : invoice.status === "Unpaid"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "invoices":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Invoice Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage all invoices, payments, and billing
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveModal("export")}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
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
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Invoice #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Due Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.slice(0, 10).map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {invoice.member?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          ${invoice.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.status === "Paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : invoice.status === "Unpaid"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(invoice.due_date).toLocaleDateString()}
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
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Expense Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Expense #
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockExpenses.slice(0, 10).map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          {expense.expense_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {expense.category}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          ${expense.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(expense.date).toLocaleDateString()}
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
            <SmartVatDashboard />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Billing Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Auto Invoicing
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically generate invoices for recurring payments
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingsChange("autoInvoicing")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoInvoicing
                        ? "bg-blue-600"
                        : "bg-gray-200 dark:bg-gray-700"
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

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Payment Reminders
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send automatic reminders for overdue payments
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingsChange("paymentReminders")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.paymentReminders
                        ? "bg-blue-600"
                        : "bg-gray-200 dark:bg-gray-700"
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

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      VAT Enabled
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable VAT calculations and reporting
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettingsChange("vatEnabled")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.vatEnabled
                        ? "bg-blue-600"
                        : "bg-gray-200 dark:bg-gray-700"
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
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              💰 Smart Billing Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Automated invoicing • Payment tracking • VAT compliance
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefreshData}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
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
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search invoices, expenses, or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
            clients={mockClients}
            onSuccess={() => {
              closeModal();
              toast.success("Invoice created successfully!");
            }}
          />
        )}

        {activeModal === "expense" && (
          <AddExpenseModal
            isOpen={activeModal === "expense"}
            onClose={closeModal}
            onSuccess={() => {
              closeModal();
              toast.success("Expense added successfully!");
            }}
          />
        )}

        {activeModal === "export" && (
          <ExportBillingDataModal
            isOpen={activeModal === "export"}
            onClose={closeModal}
            onSuccess={() => {
              closeModal();
              handleExportReports();
            }}
          />
        )}

        {activeModal === "viewInvoice" && selectedInvoice && (
          <NewInvoiceModal
            isOpen={activeModal === "viewInvoice"}
            onClose={closeModal}
            invoice={selectedInvoice}
            isViewMode={true}
            onSuccess={() => {
              closeModal();
              toast.success("Invoice updated successfully!");
            }}
          />
        )}

        {activeModal === "editInvoice" && selectedInvoice && (
          <NewInvoiceModal
            isOpen={activeModal === "editInvoice"}
            onClose={closeModal}
            invoice={selectedInvoice}
            isViewMode={false}
            onSuccess={() => {
              closeModal();
              toast.success("Invoice updated successfully!");
            }}
          />
        )}

        {activeModal === "viewExpense" && selectedExpense && (
          <AddExpenseModal
            isOpen={activeModal === "viewExpense"}
            onClose={closeModal}
            expense={selectedExpense}
            isViewMode={true}
            onSuccess={() => {
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
            isViewMode={false}
            onSuccess={() => {
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
