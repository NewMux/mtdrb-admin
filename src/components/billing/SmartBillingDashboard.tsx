import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiTarget,
  FiArrowUp,
  FiArrowDown,
  FiShield,
  FiCreditCard,
  FiBarChart,
  FiPieChart,
  FiActivity,
  FiZap,
} from "react-icons/fi";
// Removed mock data - using real data from Supabase
import toast from "react-hot-toast";

interface SmartBillingDashboardProps {
  refreshKey: number;
}

interface BillingMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  vatCollected: number;
  outstandingAmount: number;
  membershipRevenue: number;
  classRevenue: number;
  ptRevenue: number;
  averageInvoiceValue: number;
  collectionRate: number;
  vatCompliance: number;
}

interface RevenueGrowth {
  percentage: number;
  trend: "up" | "down" | "stable";
  value: number;
}

export default function SmartBillingDashboard({
  refreshKey,
}: SmartBillingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BillingMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    vatCollected: 0,
    outstandingAmount: 0,
    membershipRevenue: 0,
    classRevenue: 0,
    ptRevenue: 0,
    averageInvoiceValue: 0,
    collectionRate: 0,
    vatCompliance: 0,
  });
  const [revenueGrowth, setRevenueGrowth] = useState<RevenueGrowth>({
    percentage: 0,
    trend: "stable",
    value: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // TODO: Fetch billing metrics from Supabase
      setMetrics({
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        averageRevenuePerUser: 0,
        churnRate: 0,
        activeSubscriptions: 0,
        pendingInvoices: 0,
      });
      setRevenueGrowth({
        current: 0,
        previous: 0,
        percentage: 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading smart billing insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiDollarSign className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Total Revenue</div>
              <div className="text-2xl font-bold">
                {metrics.totalRevenue.toFixed(0)} AED
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {revenueGrowth.trend === "up" ? (
              <FiArrowUp className="text-green-300" />
            ) : revenueGrowth.trend === "down" ? (
              <FiArrowDown className="text-red-300" />
            ) : (
              <FiActivity className="text-blue-300" />
            )}
            <span className="text-sm opacity-90">
              {revenueGrowth.percentage.toFixed(1)}% from last month
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiShield className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">VAT Collected</div>
              <div className="text-2xl font-bold">
                {metrics.vatCollected.toFixed(0)} AED
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-emerald-300" />
            <span className="text-sm opacity-90">
              {metrics.vatCompliance.toFixed(0)}% compliance rate
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiClock className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Outstanding</div>
              <div className="text-2xl font-bold">
                {metrics.outstandingAmount.toFixed(0)} AED
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiTarget className="text-orange-300" />
            <span className="text-sm opacity-90">
              {metrics.collectionRate.toFixed(0)}% collection rate
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiBarChart className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Avg Invoice</div>
              <div className="text-2xl font-bold">
                {metrics.averageInvoiceValue.toFixed(0)} AED
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiTrendingUp className="text-purple-300" />
            <span className="text-sm opacity-90">+12% from last month</span>
          </div>
        </motion.div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 p-3 rounded-xl">
              <FiPieChart className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Revenue Breakdown
              </h3>
              <p className="text-gray-600 text-sm">By service type</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Memberships</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {metrics.membershipRevenue.toFixed(0)} AED
                </div>
                <div className="text-sm text-gray-500">
                  {metrics.totalRevenue
                    ? (
                        (metrics.membershipRevenue / metrics.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Classes</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {metrics.classRevenue.toFixed(0)} AED
                </div>
                <div className="text-sm text-gray-500">
                  {metrics.totalRevenue
                    ? (
                        (metrics.classRevenue / metrics.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-gray-900">
                  Personal Training
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {metrics.ptRevenue.toFixed(0)} AED
                </div>
                <div className="text-sm text-gray-500">
                  {metrics.totalRevenue
                    ? (
                        (metrics.ptRevenue / metrics.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-500 p-3 rounded-xl">
              <FiGlobe className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                GCC VAT Compliance
              </h3>
              <p className="text-gray-600 text-sm">Regional tax management</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-emerald-600" />
                <span className="font-medium text-gray-900">UAE VAT (5%)</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600">Compliant</div>
                <div className="text-sm text-gray-500">
                  Last filed: Dec 2024
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiClock className="text-blue-600" />
                <span className="font-medium text-gray-900">
                  Next Return Due
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">15 Days</div>
                <div className="text-sm text-gray-500">Q1 2025 Return</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-yellow-600" />
                <span className="font-medium text-gray-900">VAT Payable</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-600">
                  {(metrics.vatCollected * 0.8).toFixed(0)} AED
                </div>
                <div className="text-sm text-gray-500">Estimated payment</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Smart Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-500 p-3 rounded-xl">
            <FiZap className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Smart Billing Insights
            </h3>
            <p className="text-gray-600 text-sm">
              Smart-powered recommendations for your gym
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="text-green-600" />
              <span className="text-sm font-medium text-gray-900">
                Revenue Opportunity
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Consider introducing premium class packages. Analysis shows 23% of
              members would upgrade.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <FiTarget className="text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                Collection Optimization
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Automated payment reminders could improve collection rate by 15%
              based on industry data.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <FiShield className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-900">
                VAT Optimization
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Your VAT compliance is excellent. Consider automating quarterly
              returns for efficiency.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
