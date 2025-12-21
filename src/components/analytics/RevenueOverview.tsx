import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart,
  FiPieChart,
  FiCalendar,
  FiUsers,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiFileText,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

interface RevenueData {
  period: string;
  revenue: number;
  change: number;
}

interface RevenueBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface RevenueOverviewProps {
  timeSeriesData: RevenueData[];
  membershipRevenue: RevenueBreakdown[];
  paymentMethodRevenue: RevenueBreakdown[];
  sourceRevenue: RevenueBreakdown[];
  topProducts: { name: string; revenue: number; units: number }[];
  vatSummary: {
    total: number;
    collected: number;
    refunded: number;
    net: number;
  };
}

const ChartPlaceholder = ({
  title,
  icon,
  data,
  type = "line",
}: {
  title: string;
  icon: React.ReactNode;
  data: any[];
  type?: "line" | "bar" | "pie";
}) => {
  const handleExportChart = () => {
    // TODO: Implement export functionality
  };

  const handleViewDetails = () => {
    // TODO: Implement details view functionality
  };

  if (!data || !Array.isArray(data)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">{icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Loading data...</p>
            </div>
          </div>
        </div>

        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 mb-2">
              {type === "line" && "📈"}
              {type === "bar" && "📊"}
              {type === "pie" && "🥧"}
            </div>
            <p className="text-gray-500 text-sm">
              {type === "line" && "Line Chart"}
              {type === "bar" && "Bar Chart"}
              {type === "pie" && "Pie Chart"}
            </p>
            <p className="text-gray-400 text-xs mt-1">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{data.length} data points</p>
          </div>
        </div>
      </div>

      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gray-300 mb-2">
            {type === "line" && "📈"}
            {type === "bar" && "📊"}
            {type === "pie" && "🥧"}
          </div>
          <p className="text-gray-500 text-sm">
            {type === "line" && "Line Chart"}
            {type === "bar" && "Bar Chart"}
            {type === "pie" && "Pie Chart"}
          </p>
          <p className="text-gray-400 text-xs mt-1">Chart.js integration</p>
        </div>
      </div>

      {data.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.slice(0, 3).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600">
                {item.period || item.category || item.name}
              </span>
              <span className="font-medium text-gray-900">
                {typeof item.revenue === "number"
                  ? `$${item.revenue.toLocaleString()}`
                  : typeof item.amount === "number"
                    ? `$${item.amount.toLocaleString()}`
                    : typeof item.units === "number"
                      ? `${item.units} units`
                      : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VATSummaryCard = ({
  vatSummary,
}: {
  vatSummary: RevenueOverviewProps["vatSummary"];
}) => {
  const handleGenerateVATReport = () => {
    // TODO: Implement VAT report generation
  };
  if (!vatSummary || typeof vatSummary !== "object") {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <FiPieChart className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">VAT Summary</h3>
            <p className="text-sm text-gray-600">
              Tax breakdown for the period
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <div className="w-20 h-6 bg-gray-200 rounded mx-auto mt-2"></div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">VAT Collected</p>
            <div className="w-16 h-6 bg-gray-200 rounded mx-auto mt-2"></div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">VAT Refunded</p>
            <div className="w-16 h-6 bg-gray-200 rounded mx-auto mt-2"></div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Net VAT</p>
            <div className="w-16 h-6 bg-gray-200 rounded mx-auto mt-2"></div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <SmartButton
            onClick={handleGenerateVATReport}
            variant="primary"
            size="sm"
            className="w-full"
          >
            Generate VAT Report
          </SmartButton>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <FiPieChart className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">VAT Summary</h3>
          <p className="text-sm text-gray-600">Tax breakdown for the period</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-xl font-bold text-gray-900">
            ${vatSummary.total.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">VAT Collected</p>
          <p className="text-xl font-bold text-green-600">
            ${vatSummary.collected.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600">VAT Refunded</p>
          <p className="text-xl font-bold text-red-600">
            ${vatSummary.refunded.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Net VAT</p>
          <p className="text-xl font-bold text-blue-600">
            ${vatSummary.net.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <SmartButton
          onClick={handleGenerateVATReport}
          variant="primary"
          size="sm"
          className="w-full"
        >
          Generate VAT Report
        </SmartButton>
      </div>
    </div>
  );
};

const TopProductsTable = ({
  products,
}: {
  products: RevenueOverviewProps["topProducts"];
}) => {
  const handleViewAll = () => {
    // TODO: Implement view all products functionality
  };
  if (!products || !Array.isArray(products)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiPieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Top Products
              </h3>
              <p className="text-sm text-gray-600">Best performing packages</p>
            </div>
          </div>
          <SmartButton onClick={handleViewAll} variant="secondary" size="sm">
            View All
          </SmartButton>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-4 bg-gray-200 rounded mb-1"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiPieChart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Top Products
            </h3>
            <p className="text-sm text-gray-600">Best performing packages</p>
          </div>
        </div>
        <SmartButton onClick={handleViewAll} variant="secondary" size="sm">
          View All
        </SmartButton>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => (
          <motion.div
            key={product.name}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">
                  {index + 1}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">
                  {product.units} units sold
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">
                ${product.revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function RevenueOverview({
  timeSeriesData,
  membershipRevenue,
  paymentMethodRevenue,
  sourceRevenue,
  topProducts,
  vatSummary,
}: RevenueOverviewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "breakdown" | "products"
  >("overview");

  const handleExportReport = () => {
    // TODO: Implement export functionality
  };

  const handleGenerateInvoice = () => {
    // TODO: Implement invoice generation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Overview</h2>
          <p className="text-gray-600">
            Track your financial performance across all channels
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          {
            id: "overview",
            label: "Overview",
            icon: <FiBarChart className="w-4 h-4" />,
          },
          {
            id: "breakdown",
            label: "Breakdown",
            icon: <FiPieChart className="w-4 h-4" />,
          },
          {
            id: "products",
            label: "Products",
            icon: <FiPieChart className="w-4 h-4" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder
            title="Revenue Trend"
            icon={<FiTrendingUp className="w-6 h-6 text-blue-600" />}
            data={timeSeriesData}
            type="line"
          />
          <VATSummaryCard vatSummary={vatSummary} />
        </div>
      )}

      {activeTab === "breakdown" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChartPlaceholder
            title="By Membership Type"
            icon={<FiUsers className="w-6 h-6 text-green-600" />}
            data={membershipRevenue}
            type="pie"
          />
          <ChartPlaceholder
            title="By Payment Method"
            icon={<FiPieChart className="w-6 h-6 text-purple-600" />}
            data={paymentMethodRevenue}
            type="bar"
          />
          <ChartPlaceholder
            title="By Source"
            icon={<FiPieChart className="w-6 h-6 text-orange-600" />}
            data={sourceRevenue}
            type="pie"
          />
        </div>
      )}

      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsTable products={topProducts} />
          <ChartPlaceholder
            title="Product Performance"
            icon={<FiPieChart className="w-6 h-6 text-purple-600" />}
            data={topProducts}
            type="bar"
          />
        </div>
      )}
    </div>
  );
}

export const defaultRevenueData: RevenueOverviewProps = {
  timeSeriesData: [
    { period: "Jan", revenue: 45000, change: 12.5 },
    { period: "Feb", revenue: 52000, change: 15.6 },
    { period: "Mar", revenue: 48000, change: -7.7 },
    { period: "Apr", revenue: 55000, change: 14.6 },
    { period: "May", revenue: 58000, change: 5.5 },
    { period: "Jun", revenue: 62000, change: 6.9 },
  ],
  membershipRevenue: [
    { category: "Premium", amount: 25000, percentage: 40, color: "#3B82F6" },
    { category: "Standard", amount: 18000, percentage: 29, color: "#10B981" },
    { category: "Basic", amount: 12000, percentage: 19, color: "#F59E0B" },
    { category: "Trial", amount: 7000, percentage: 12, color: "#EF4444" },
  ],
  paymentMethodRevenue: [
    {
      category: "Credit Card",
      amount: 35000,
      percentage: 56,
      color: "#3B82F6",
    },
    { category: "Cash", amount: 15000, percentage: 24, color: "#10B981" },
    {
      category: "Bank Transfer",
      amount: 8000,
      percentage: 13,
      color: "#F59E0B",
    },
    {
      category: "Digital Wallet",
      amount: 4000,
      percentage: 7,
      color: "#EF4444",
    },
  ],
  sourceRevenue: [
    { category: "Website", amount: 28000, percentage: 45, color: "#3B82F6" },
    {
      category: "Social Media",
      amount: 18000,
      percentage: 29,
      color: "#10B981",
    },
    { category: "Referral", amount: 8000, percentage: 13, color: "#F59E0B" },
    { category: "Walk-in", amount: 5000, percentage: 8, color: "#EF4444" },
    { category: "Google Ads", amount: 3000, percentage: 5, color: "#8B5CF6" },
  ],
  topProducts: [
    { name: "Premium Annual", revenue: 15000, units: 25 },
    { name: "Personal Training", revenue: 12000, units: 60 },
    { name: "Group Classes", revenue: 8000, units: 200 },
    { name: "Equipment Rental", revenue: 5000, units: 100 },
    { name: "Nutrition Plan", revenue: 3000, units: 30 },
  ],
  vatSummary: {
    total: 62000,
    collected: 6200,
    refunded: 800,
    net: 5400,
  },
};
