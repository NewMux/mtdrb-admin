import React from 'react';
import { FiUsers, FiUserPlus, FiTrendingUp, FiActivity, FiUserCheck } from 'react-icons/fi';
import SmartKpiCard from '../ui/SmartKpiCard';

const engagementItems = [
  {
    label: 'Active Members',
    value: 247,
    icon: <FiUsers className="h-6 w-6 text-blue-600" />,
    color: 'blue',
    trend: 'up',
    trendValue: '5',
    tooltip: 'Number of currently active members.',
    context: '+2% vs. last week',
  },
  {
    label: 'New Signups',
    value: 12,
    icon: <FiUserPlus className="h-6 w-6 text-green-600" />,
    color: 'green',
    trend: 'up',
    trendValue: '2',
    tooltip: 'New members signed up this week.',
    context: '+20% vs. last week',
  },
  {
    label: 'Retention Rate',
    value: '94%',
    icon: <FiTrendingUp className="h-6 w-6 text-purple-600" />,
    color: 'purple',
    trend: 'up',
    trendValue: '1%',
    tooltip: 'Percentage of members retained this month.',
    context: '+1% vs. last month',
  },
  {
    label: 'Avg Sessions/Member',
    value: '3.2',
    icon: <FiActivity className="h-6 w-6 text-orange-500" />,
    color: 'orange',
    trend: 'up',
    trendValue: '0.2',
    tooltip: 'Average number of sessions attended per member this month.',
    context: '+7% vs. last month',
  },
];

const MemberEngagement: React.FC = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FiUserCheck className="text-green-500" /> Member Engagement
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {engagementItems.map((item, idx) => (
        <SmartKpiCard key={idx} {...item} />
      ))}
    </div>
  </section>
);

export default MemberEngagement; 