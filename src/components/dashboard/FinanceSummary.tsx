import React from "react";
import { FiFileText, FiDollarSign, FiAlertCircle, FiZap } from "react-icons/fi";
import SmartKpiCard, { type SmartKpiCardProps } from "../ui/SmartKpiCard";

const financeItems: SmartKpiCardProps[] = [
  {
    label: "Unpaid Invoices",
    value: 12,
    icon: <FiFileText className="h-6 w-6 text-yellow-600" />,
    color: "yellow",
    trend: "down",
    trendValue: "2",
    tooltip: "Number of invoices not yet paid.",
    context: "-14% vs. last month",
  },
  {
    label: "VAT Collected",
    value: "BHD 1200",
    icon: <FiDollarSign className="h-6 w-6 text-green-600" />,
    color: "green",
    trend: "up",
    trendValue: "BHD 100",
    tooltip: "Total VAT collected this month.",
    context: "+9% vs. last month",
  },
];

const latestExpenses = [
  {
    label: "Utilities",
    amount: 350,
    color: "blue",
    icon: <FiZap className="text-blue-500" />,
  },
  {
    label: "Internet",
    amount: 120,
    color: "purple",
    icon: <FiZap className="text-purple-500" />,
  },
  {
    label: "Supplies",
    amount: 60,
    color: "green",
    icon: <FiZap className="text-green-500" />,
  },
];

const LatestExpensesCard: React.FC = () => (
  <div className="p-6 rounded-2xl shadow-sm gap-2 flex flex-col items-start bg-blue-50 text-blue-600 transition-colors duration-300 ease-in-out">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-xl bg-blue-50">
        <FiAlertCircle />
      </div>
      <span className="text-sm font-medium opacity-80">Latest Expenses</span>
    </div>
    <div className="flex flex-col w-full mt-2">
      {latestExpenses.map((exp, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between py-1 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-2">
            {exp.icon}
            <span className="text-sm font-medium opacity-80">{exp.label}</span>
          </div>
          <span className="text-sm opacity-70">BHD {exp.amount}</span>
        </div>
      ))}
    </div>
  </div>
);

const FinanceSummary: React.FC<{ role: string }> = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FiDollarSign className="text-green-500" /> Finance
      Summary
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {financeItems.map((item, idx) => (
        <SmartKpiCard key={idx} {...item} />
      ))}
      <LatestExpensesCard />
    </div>
  </section>
);

export default FinanceSummary;
