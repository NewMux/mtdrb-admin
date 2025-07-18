import React from 'react';
import { FiUser, FiStar, FiCalendar, FiHeart, FiAward } from 'react-icons/fi';
import SmartKpiCard from '../ui/SmartKpiCard';

const performanceItems = [
  {
    label: 'Active Trainers',
    value: 8,
    icon: <FiUser className="h-6 w-6 text-blue-600" />,
    color: 'blue',
    trend: 'up',
    trendValue: '1',
    tooltip: 'Number of trainers currently active.',
    context: '+14% vs. last month',
  },
  {
    label: 'Avg Rating',
    value: '4.8/5',
    icon: <FiStar className="h-6 w-6 text-yellow-500" />,
    color: 'yellow',
    trend: 'up',
    trendValue: '0.1',
    tooltip: 'Average trainer rating from member feedback.',
    context: '+2% vs. last month',
  },
  {
    label: 'Classes Taught',
    value: 156,
    icon: <FiCalendar className="h-6 w-6 text-green-600" />,
    color: 'green',
    trend: 'up',
    trendValue: '6',
    tooltip: 'Total classes taught by trainers this month.',
    context: '+4% vs. last month',
  },
  {
    label: 'Member Satisfaction',
    value: '96%',
    icon: <FiHeart className="h-6 w-6 text-red-500" />,
    color: 'red',
    trend: 'up',
    trendValue: '1%',
    tooltip: 'Member satisfaction with trainers.',
    context: '+1% vs. last month',
  },
];

const TrainerPerformance: React.FC = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FiAward className="text-yellow-500" /> Trainer Performance
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {performanceItems.map((item, idx) => (
        <SmartKpiCard key={idx} {...item} />
      ))}
    </div>
  </section>
);

export default TrainerPerformance; 