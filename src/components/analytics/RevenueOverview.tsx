import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiBarChart,
  FiPieChart,
  FiUsers,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";
import { useRTL } from "../../hooks/useRTL";

type ActiveTab = "overview" | "breakdown" | "products";

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

interface ChartPreviewItem {
  period?: string;
  category?: string;
  name?: string;
  revenue?: number;
  amount?: number;
  units?: number;
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
  data: ChartPreviewItem[];
  type?: "line" | "bar" | "pie";
}) => {
  if (!data || !Array.isArray(data)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">{icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading data...</p>
            </div>
          </div>
        </div>

        <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">
              {type === "line" && "📈"}
              {type === "bar" && "📊"}
              {type === "pie" && "🥧"}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {type === "line" && "Line Chart"}
              {type === "bar" && "Bar Chart"}
              {type === "pie" && "Pie Chart"}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{data.length} data points</p>
          </div>
        </div>
      </div>

      <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">
            {type === "line" && "📈"}
            {type === "bar" && "📊"}
            {type === "pie" && "🥧"}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {type === "line" && "Line Chart"}
            {type === "bar" && "Bar Chart"}
            {type === "pie" && "Pie Chart"}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Chart.js integration</p>
        </div>
      </div>

      {data.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.slice(0, 3).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600 dark:text-gray-400">
                {item.period || item.category || item.name}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <FiPieChart className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">VAT Summary</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tax breakdown for the period
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-600 rounded mx-auto mt-2"></div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">VAT Collected</p>
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded mx-auto mt-2"></div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">VAT Refunded</p>
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded mx-auto mt-2"></div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Net VAT</p>
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded mx-auto mt-2"></div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <FiPieChart className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">VAT Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tax breakdown for the period</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ${vatSummary.total.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">VAT Collected</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            ${vatSummary.collected.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">VAT Refunded</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            ${vatSummary.refunded.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Net VAT</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            ${vatSummary.net.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiPieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Products
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Best performing packages</p>
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
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div>
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                  <div className="w-24 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="w-16 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiPieChart className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Products
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Best performing packages</p>
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
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
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
                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {product.units} units sold
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white">
                ${product.revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
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
  const { isRTL } = useRTL();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
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
  ];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue Overview</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your financial performance across all channels
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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

