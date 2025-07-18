import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBarChart, FiTrendingUp, FiTrendingDown, FiDollarSign, 
  FiCalendar, FiTarget, FiUsers, FiPieChart, FiActivity,
  FiArrowUp, FiArrowDown, FiClock, FiShield, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface SmartBillingAnalyticsProps {
  refreshKey: number;
}

interface AnalyticsData {
  monthlyRevenue: number[];
  revenueGrowth: number;
  paymentTrends: {
    cash: number;
    card: number;
    bank: number;
    online: number;
  };
  customerSegments: {
    vip: number;
    regular: number;
    new: number;
    atRisk: number;
  };
  forecasts: {
    nextMonth: number;
    nextQuarter: number;
    yearEnd: number;
  };
  vatAnalysis: {
    collected: number;
    payable: number;
    compliance: number;
  };
}

export default function SmartBillingAnalytics({ refreshKey }: SmartBillingAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    monthlyRevenue: [],
    revenueGrowth: 0,
    paymentTrends: { cash: 0, card: 0, bank: 0, online: 0 },
    customerSegments: { vip: 0, regular: 0, new: 0, atRisk: 0 },
    forecasts: { nextMonth: 0, nextQuarter: 0, yearEnd: 0 },
    vatAnalysis: { collected: 0, payable: 0, compliance: 0 }
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [refreshKey]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Mock analytics data for demonstration
      const mockData: AnalyticsData = {
        monthlyRevenue: [45000, 52000, 48000, 61000, 58000, 67000],
        revenueGrowth: 15.4,
        paymentTrends: {
          cash: 35,
          card: 40,
          bank: 15,
          online: 10
        },
        customerSegments: {
          vip: 25,
          regular: 45,
          new: 20,
          atRisk: 10
        },
        forecasts: {
          nextMonth: 72000,
          nextQuarter: 215000,
          yearEnd: 850000
        },
        vatAnalysis: {
          collected: 15600,
          payable: 12800,
          compliance: 98.5
        }
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiTrendingUp className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Revenue Growth</div>
              <div className="text-2xl font-bold">{analyticsData.revenueGrowth}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiArrowUp className="text-green-300" />
            <span className="text-sm opacity-90">Month over month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiTarget className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Next Month Forecast</div>
              <div className="text-2xl font-bold">{analyticsData.forecasts.nextMonth.toLocaleString()} AED</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-green-300" />
            <span className="text-sm opacity-90">Projected revenue</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiShield className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">VAT Compliance</div>
              <div className="text-2xl font-bold">{analyticsData.vatAnalysis.compliance}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiActivity className="text-purple-300" />
            <span className="text-sm opacity-90">GCC compliance rate</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiDollarSign className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Year-End Forecast</div>
              <div className="text-2xl font-bold">{analyticsData.forecasts.yearEnd.toLocaleString()} AED</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiZap className="text-orange-300" />
            <span className="text-sm opacity-90">Projected annual</span>
          </div>
        </motion.div>
      </div>

      {/* Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 p-3 rounded-xl">
              <FiBarChart className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Trends</h3>
              <p className="text-gray-600 text-sm">Monthly performance over time</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Month</span>
              <span className="text-lg font-bold text-green-600">
                {analyticsData.monthlyRevenue[analyticsData.monthlyRevenue.length - 1]?.toLocaleString()} AED
              </span>
            </div>
            
            {/* Simple bar chart visualization */}
            <div className="space-y-2">
              {analyticsData.monthlyRevenue.map((revenue, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 text-xs text-gray-500">
                    {months[index]}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                      style={{
                        width: `${(revenue / Math.max(...analyticsData.monthlyRevenue)) * 100}%`
                      }}
                    />
                  </div>
                  <div className="w-16 text-xs text-gray-700 text-right">
                    {revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500 p-3 rounded-xl">
              <FiPieChart className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Payment Methods</h3>
              <p className="text-gray-600 text-sm">Distribution of payment types</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Card Payments</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{analyticsData.paymentTrends.card}%</div>
                <div className="text-sm text-gray-500">Most popular</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Cash</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{analyticsData.paymentTrends.cash}%</div>
                <div className="text-sm text-gray-500">Traditional</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Bank Transfer</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{analyticsData.paymentTrends.bank}%</div>
                <div className="text-sm text-gray-500">Reliable</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Online</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{analyticsData.paymentTrends.online}%</div>
                <div className="text-sm text-gray-500">Growing</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Customer Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500 p-3 rounded-xl">
              <FiUsers className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Customer Segments</h3>
              <p className="text-gray-600 text-sm">Member categorization by value</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">VIP Members</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-600">{analyticsData.customerSegments.vip}%</div>
                <div className="text-sm text-gray-500">High value</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Regular Members</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">{analyticsData.customerSegments.regular}%</div>
                <div className="text-sm text-gray-500">Core base</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">New Members</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analyticsData.customerSegments.new}%</div>
                <div className="text-sm text-gray-500">Growing</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium text-gray-900">At Risk</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600">{analyticsData.customerSegments.atRisk}%</div>
                <div className="text-sm text-gray-500">Needs attention</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-500 p-3 rounded-xl">
              <FiTarget className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Forecasts</h3>
              <p className="text-gray-600 text-sm">AI-powered predictions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiCalendar className="text-blue-600 text-xl" />
                <span className="font-medium text-gray-900">Next Month</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">{analyticsData.forecasts.nextMonth.toLocaleString()} AED</div>
                <div className="text-sm text-gray-500">+7% projected</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiClock className="text-green-600 text-xl" />
                <span className="font-medium text-gray-900">Next Quarter</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{analyticsData.forecasts.nextQuarter.toLocaleString()} AED</div>
                <div className="text-sm text-gray-500">Q1 2025 target</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FiTrendingUp className="text-purple-600 text-xl" />
                <span className="font-medium text-gray-900">Year End</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-600">{analyticsData.forecasts.yearEnd.toLocaleString()} AED</div>
                <div className="text-sm text-gray-500">Annual projection</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
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
            <h3 className="text-xl font-bold text-gray-900">AI-Powered Insights</h3>
            <p className="text-gray-600 text-sm">Smart recommendations based on your data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="text-green-600" />
              <span className="text-sm font-medium text-gray-900">Revenue Opportunity</span>
            </div>
            <p className="text-xs text-gray-600">
              Peak revenue months are October-December. Consider promotional campaigns in Q4.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Customer Retention</span>
            </div>
            <p className="text-xs text-gray-600">
              10% of members are at risk. Implement targeted retention campaigns.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <FiShield className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-900">VAT Optimization</span>
            </div>
            <p className="text-xs text-gray-600">
              Excellent VAT compliance. Consider quarterly filing for efficiency.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 