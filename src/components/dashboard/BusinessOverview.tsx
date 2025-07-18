import React from 'react';
import { FiUsers, FiDollarSign, FiUserPlus, FiArrowDownRight, FiArrowUpRight, FiTrendingUp, FiPieChart, FiBarChart2, FiActivity } from 'react-icons/fi';
import SmartKpiCard from '../ui/SmartKpiCard';

/**
 * BusinessOverview displays key gym KPIs in Apple-style cards.
 * @returns {JSX.Element}
 */
const kpis = [
  {
    label: 'Active Members',
    value: 247,
    icon: <FiUsers className="h-6 w-6" />, 
    color: 'blue',
    trend: 'up',
    trendValue: '5',
    tooltip: 'Number of currently active memberships.',
    context: '+2% vs. last week',
  },
  {
    label: 'Monthly Revenue (VAT)',
    value: 'BHD 12,400',
    icon: <FiDollarSign className="h-6 w-6" />, 
    color: 'green',
    trend: 'up',
    trendValue: 'BHD 400',
    tooltip: 'Total revenue this month including VAT.',
    context: '+3% vs. last month',
  },
  {
    label: 'New Signups (30d)',
    value: 32,
    icon: <FiUserPlus className="h-6 w-6" />, 
    color: 'purple',
    trend: 'up',
    trendValue: '4',
    tooltip: 'New members in the last 30 days.',
    context: '+14% vs. last 30d',
  },
  {
    label: 'Churn Rate',
    value: '3.2%',
    icon: <FiArrowDownRight className="h-6 w-6" />, 
    color: 'red',
    trend: 'down',
    trendValue: '0.4%',
    tooltip: 'Monthly churn rate.',
    context: '-0.2% vs. last month',
  },
  {
    label: 'Trainer Utilization',
    value: '82%',
    icon: <FiPieChart className="h-6 w-6" />, 
    color: 'yellow',
    trend: 'up',
    trendValue: '2%',
    tooltip: 'Percent of trainer hours booked.',
    context: '+1% vs. last week',
  },
  {
    label: 'Occupancy Rate',
    value: '74%',
    icon: <FiBarChart2 className="h-6 w-6" />, 
    color: 'purple',
    trend: 'down',
    trendValue: '1%',
    tooltip: 'Percent of class capacity filled.',
    context: '-2% vs. last week',
  },
  {
    label: 'Cash Flow (30d)',
    value: 'BHD 2,100',
    icon: <FiActivity className="h-6 w-6" />, 
    color: 'orange',
    trend: 'up',
    trendValue: 'BHD 200',
    tooltip: 'Net cash flow last 30 days.',
    context: '+11% vs. last 30d',
  }
];

const BusinessOverview: React.FC = () => (
  <section className="mb-8 bg-white border border-gray-200 rounded-2xl p-8 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-300">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-50 rounded-xl">
        <FiTrendingUp className="text-blue-600 text-xl" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight dark:text-white">Business Overview</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpis.map((kpi, idx) => (
        <SmartKpiCard
          key={idx}
          {...kpi}
        />
      ))}
    </div>
  </section>
);

export default BusinessOverview; 