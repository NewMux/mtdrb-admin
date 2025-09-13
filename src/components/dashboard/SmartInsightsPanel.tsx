import React from "react";
import { FiZap } from "react-icons/fi";

const insights = [
  {
    icon: "📈",
    title: "Member Growth",
    description: "+12% this month",
    color: "blue",
    context: "Best month this year",
  },
  {
    icon: "💰",
    title: "Revenue Opportunity",
    description: "BHD 2,400 potential",
    color: "green",
    context: "Upsell premium plans",
  },
  {
    icon: "⚡",
    title: "Peak Hours",
    description: "6-8 PM busiest",
    color: "purple",
    context: "Consider more classes",
  },
  {
    icon: "🎯",
    title: "Retention Alert",
    description: "3 members at risk",
    color: "red",
    context: "Send engagement offers",
  },
];

const colorBg = {
  blue: "bg-blue-50 dark:bg-blue-950",
  green: "bg-green-50 dark:bg-green-950",
  purple: "bg-purple-50 dark:bg-purple-950",
  red: "bg-red-50 dark:bg-red-950",
};
const colorText = {
  blue: "text-blue-600 dark:text-blue-300",
  green: "text-green-600 dark:text-green-300",
  purple: "text-purple-600 dark:text-purple-300",
  red: "text-red-600 dark:text-red-300",
};

const SmartInsightsPanel: React.FC = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <FiZap className="text-purple-500 dark:text-purple-300" /> Smart Insights
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`p-6 rounded-2xl shadow-sm gap-2 flex flex-col items-start ${colorBg[insight.color]} ${colorText[insight.color]} transition-colors duration-300 ease-in-out`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-xl ${colorBg[insight.color]} dark:bg-opacity-80`}
            >
              {insight.icon}
            </div>
            <span className="text-sm font-medium opacity-80">
              {insight.title}
            </span>
          </div>
          <div className="text-2xl font-bold">{insight.value}</div>
          <div className="text-sm opacity-70">{insight.description}</div>
          {insight.context && (
            <div className="text-xs mt-1 opacity-70">{insight.context}</div>
          )}
        </div>
      ))}
    </div>
  </section>
);

export default SmartInsightsPanel;
