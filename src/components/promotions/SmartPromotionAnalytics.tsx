import React from "react";
import { FiBarChart, FiTrendingUp, FiTarget, FiUsers } from "react-icons/fi";

interface SmartPromotionAnalyticsProps {
  refreshKey: number;
}

const SmartPromotionAnalytics: React.FC<SmartPromotionAnalyticsProps> = ({
  refreshKey,
}) => {
  const analytics = {
    conversionRates: [
      { period: "This Week", rate: 24.5, conversions: 89, revenue: "$4,450" },
      { period: "Last Week", rate: 21.3, conversions: 67, revenue: "$3,350" },
      {
        period: "This Month",
        rate: 23.1,
        conversions: 234,
        revenue: "$11,700",
      },
    ],
    channels: [
      { name: "Email", conversions: 156, rate: 19.9, cost: "$245" },
      { name: "In-App", conversions: 145, rate: 23.3, cost: "$89" },
      { name: "Social Media", conversions: 89, rate: 7.0, cost: "$340" },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Smart Promotion Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced performance insights and ROI analysis
          </p>
        </div>
        <button className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
          View Details
        </button>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analytics.conversionRates.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{metric.period}</h3>
              <FiTarget className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {metric.rate}%
            </p>
            <p className="text-sm text-gray-600 mb-3">
              {metric.conversions} conversions
            </p>
            <p className="text-lg font-semibold text-green-600">
              {metric.revenue}
            </p>
          </div>
        ))}
      </div>

      {/* Channel Performance */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Channel Performance
        </h2>
        <div className="space-y-4">
          {analytics.channels.map((channel, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {channel.name}
                  </span>
                  <span className="font-bold text-purple-600">
                    {channel.rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${channel.rate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{channel.conversions} conversions</span>
                  <span>{channel.cost} cost</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            ROI by Campaign
          </h3>
          <div className="space-y-3">
            {[
              { name: "New Year Special", roi: "340%", revenue: "$4,450" },
              { name: "Referral Program", roi: "280%", revenue: "$3,350" },
              { name: "Holiday Promotion", roi: "225%", revenue: "$2,250" },
            ].map((campaign, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
              >
                <span className="font-medium text-gray-900">
                  {campaign.name}
                </span>
                <div className="text-right">
                  <p className="font-bold text-green-600">{campaign.roi}</p>
                  <p className="text-sm text-gray-600">{campaign.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            {[
              {
                icon: FiTrendingUp,
                title: "Conversion Trending Up",
                desc: "24.5% this week vs 21.3% last week",
              },
              {
                icon: FiUsers,
                title: "In-App Performs Best",
                desc: "23.3% conversion rate, lowest cost",
              },
              {
                icon: FiBarChart,
                title: "Peak Performance",
                desc: "Tuesday 2-4 PM shows highest engagement",
              },
            ].map((insight, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-purple-50 rounded-2xl"
              >
                <insight.icon className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-600">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPromotionAnalytics;
export { SmartPromotionAnalytics };
