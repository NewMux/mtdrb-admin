import React, { useState, useEffect } from 'react';
import { FiBarChart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiPercent, FiCalendar, FiEye, FiDownload, FiGift } from 'react-icons/fi';

interface AnalyticsData {
  totalCodes: number;
  activeCodes: number;
  totalRevenue: number;
  totalUses: number;
  avgConversionRate: number;
  topPerformingCodes: Array<{
    code: string;
    revenue: number;
    uses: number;
    conversionRate: number;
    type: string;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    uses: number;
  }>;
  usageBySegment: Array<{
    segment: string;
    uses: number;
    revenue: number;
  }>;
}

const PromoCodeAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockData: AnalyticsData = {
      totalCodes: 12,
      activeCodes: 8,
      totalRevenue: 28450,
      totalUses: 456,
      avgConversionRate: 18.5,
      topPerformingCodes: [
        { code: 'NEWYEAR2024', revenue: 4450, uses: 67, conversionRate: 24.5, type: 'percentage' },
        { code: 'FRIEND50', revenue: 3350, uses: 23, conversionRate: 18.2, type: 'flat' },
        { code: 'STUDENT25', revenue: 1700, uses: 34, conversionRate: 12.8, type: 'percentage' },
        { code: 'HOLIDAY30', revenue: 2250, uses: 45, conversionRate: 31.5, type: 'percentage' }
      ],
      revenueByMonth: [
        { month: 'Jan', revenue: 8500, uses: 145 },
        { month: 'Feb', revenue: 7200, uses: 123 },
        { month: 'Mar', revenue: 6800, uses: 98 },
        { month: 'Apr', revenue: 5950, uses: 90 }
      ],
      usageBySegment: [
        { segment: 'New Members', uses: 156, revenue: 8900 },
        { segment: 'Premium Members', uses: 89, revenue: 4450 },
        { segment: 'Inactive Members', uses: 67, revenue: 3350 },
        { segment: 'Students', uses: 78, revenue: 3900 },
        { segment: 'All Members', uses: 66, revenue: 2850 }
      ]
    };

    setAnalyticsData(mockData);
    setLoading(false);
  }, []);

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promo Code Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance and optimize your discount strategies</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center space-x-2">
            <FiDownload className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <FiGift className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-emerald-600">
              <FiTrendingUp className="h-4 w-4" />
              <span>+12%</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Codes</h3>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalCodes}</p>
            <p className="text-xs text-gray-500 mt-1">{analyticsData.activeCodes} active</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-emerald-600">
              <FiTrendingUp className="h-4 w-4" />
              <span>+18%</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">${analyticsData.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">From all codes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-emerald-600">
              <FiTrendingUp className="h-4 w-4" />
              <span>+8%</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Uses</h3>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalUses}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <FiPercent className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-emerald-600">
              <FiTrendingUp className="h-4 w-4" />
              <span>+3.2%</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Conversion</h3>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.avgConversionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Across all codes</p>
          </div>
        </div>
      </div>

      {/* Top Performing Codes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Codes</h2>
        <div className="space-y-4">
          {analyticsData.topPerformingCodes.map((code, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-gray-900 font-mono">{code.code}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      code.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {code.type === 'percentage' ? `${code.conversionRate}%` : `$${code.revenue / code.uses}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{code.uses} uses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">${code.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{code.conversionRate}% conversion</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h2>
        <div className="h-64 flex items-end justify-between space-x-2">
          {analyticsData.revenueByMonth.map((month, index) => {
            const maxRevenue = Math.max(...analyticsData.revenueByMonth.map(m => m.revenue));
            const height = (month.revenue / maxRevenue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-100 rounded-t-lg relative" style={{ height: `${height}%` }}>
                  <div className="absolute inset-0 bg-purple-600 rounded-t-lg"></div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900">${month.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{month.month}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage by Segment */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Usage by Target Segment</h2>
        <div className="space-y-4">
          {analyticsData.usageBySegment.map((segment, index) => {
            const totalUses = analyticsData.usageBySegment.reduce((sum, s) => sum + s.uses, 0);
            const percentage = Math.round((segment.uses / totalUses) * 100);
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{segment.segment}</span>
                    <span className="font-bold text-blue-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{segment.uses} uses</span>
                    <span>${segment.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <FiTrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Best Performing</h3>
            </div>
            <p className="text-green-700 text-sm">
              Percentage-based codes show 24% higher conversion rates than flat discounts
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <FiUsers className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Target Audience</h3>
            </div>
            <p className="text-blue-700 text-sm">
              New member promotions drive 34% of total promo code revenue
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <FiCalendar className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Seasonal Trends</h3>
            </div>
            <p className="text-yellow-700 text-sm">
              Holiday promotions see 45% higher engagement than regular campaigns
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <FiDollarSign className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800">Revenue Impact</h3>
            </div>
            <p className="text-purple-700 text-sm">
              Promo codes contribute 18% to total monthly revenue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeAnalytics;
export { PromoCodeAnalytics }; 