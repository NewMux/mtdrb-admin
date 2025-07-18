import React, { useState } from 'react';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiDollarSign, 
  FiClock, 
  FiDownload, 
  FiMessageCircle, 
  FiGift, 
  FiZap,
  FiArrowUp,
  FiArrowDown,
  FiTarget,
  FiActivity,
  FiUserCheck,
  FiUserPlus,
  FiCreditCard,
  FiAlertCircle,
  FiStar,
  FiAward,
  FiRefreshCw
} from 'react-icons/fi';

// Simple metric data
const metrics = {
  totalMembers: 1247,
  activeMembers: 892,
  engagementScore: 78.5,
  monthlyRevenue: 98750,
  goalProgress: 67.8,
  topPerformers: 156,
  checkinsPerWeek: 3.2,
  retentionRate: 87.3,
  highRiskMembers: 67,
  paymentSuccess: 96.8,
  overdueAmount: 3450,
  newMembers: 23
};

// Simple Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  sparkline?: number[];
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  sparkline,
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600'
  };

  const graphColors = {
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
    purple: '#8B5CF6'
  };

  return (
    <div 
      className={`relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-gray-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Top Section - Title and Trend Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {icon && (
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-500 text-xs font-medium">i</div>
            </div>
          )}
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
            trend.isPositive 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {trend.isPositive ? (
              <FiArrowUp className="w-3 h-3" />
            ) : (
              <FiArrowDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value Section */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Line Graph Section */}
      {sparkline && (
        <div className="mt-4">
          <Sparkline data={sparkline} color={color} />
        </div>
      )}
    </div>
  );
};

// Enhanced Sparkline Component with area fill
interface SparklineProps {
  data: number[];
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, width = 200, height = 60 }) => {
  if (data.length < 2) return null;

  const colorMap = {
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
    purple: '#8B5CF6'
  };

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorMap[color]} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colorMap[color]} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#gradient-${color})`}
        points={areaPoints}
      />
      <polyline
        fill="none"
        stroke={colorMap[color]}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

// Simple Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  action: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red';
  onClick: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  action,
  count,
  icon,
  color,
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
  };

  return (
    <div 
      className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${colorClasses[color]}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/50">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs opacity-80 mt-1">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{count}</div>
          <div className="text-xs opacity-80">{action}</div>
        </div>
      </div>
    </div>
  );
};

// Simple Smart Insights Panel
const SmartInsightsPanel: React.FC = () => {
  const insights = [
    {
      type: 'warning',
      title: 'High Churn Risk',
      description: '12 members show signs of potential churn',
      action: 'Review Now',
      icon: <FiAlertTriangle className="w-4 h-4" />
    },
    {
      type: 'success',
      title: 'Revenue Opportunity',
      description: '45 members ready for upsell',
      action: 'Contact',
      icon: <FiTrendingUp className="w-4 h-4" />
    },
    {
      type: 'info',
      title: 'Goal Achievement',
      description: '23 members completed goals this week',
      action: 'Celebrate',
      icon: <FiAward className="w-4 h-4" />
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <FiZap className="text-blue-600 w-5 h-5" />
        <h3 className="text-lg font-semibold text-gray-900">Smart Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
            <div className={`p-2 rounded-lg ${
              insight.type === 'warning' ? 'bg-red-100 text-red-600' :
              insight.type === 'success' ? 'bg-green-100 text-green-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {insight.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm text-gray-900">{insight.title}</h4>
              <p className="text-xs text-gray-600">{insight.description}</p>
            </div>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
              {insight.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface AnalyticsTabProps {
  members: any[];
  stats: any;
  onFilterMembers?: (filter: any) => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ members, stats, onFilterMembers }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const handleMetricClick = (filterType: string, value: any) => {
    if (onFilterMembers) {
      onFilterMembers({ type: filterType, value });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights into member behavior and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-select text-sm border-gray-300 rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Total Members"
          value={metrics.totalMembers.toLocaleString()}
          subtitle="Active gym members"
          trend={{ value: 5.2, isPositive: true, period: 'vs last month' }}
          color="blue"
          sparkline={[72, 74, 76, 78, 77, 79, 78.5]}
          onClick={() => handleMetricClick('totalMembers', 'all')}
        />
        <MetricCard
          title="Active Members"
          value={metrics.activeMembers.toLocaleString()}
          subtitle={`${((metrics.activeMembers / metrics.totalMembers) * 100).toFixed(1)}% of total`}
          trend={{ value: 3.8, isPositive: true, period: 'vs last month' }}
          color="green"
          sparkline={[85, 86, 87, 87.3, 87, 88, 87.3]}
          onClick={() => handleMetricClick('status', 'active')}
        />
        <MetricCard
          title="Engagement Score"
          value={`${metrics.engagementScore}%`}
          subtitle="Average member engagement"
          trend={{ value: 2.1, isPositive: true, period: 'vs last month' }}
          color="purple"
          sparkline={[72, 74, 76, 78, 77, 79, 78.5]}
          onClick={() => handleMetricClick('engagementScore', '>70')}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${metrics.monthlyRevenue.toLocaleString()}`}
          subtitle={`$${89.5} per member`}
          trend={{ value: 12.4, isPositive: true, period: 'vs last month' }}
          color="green"
          sparkline={[110000, 115000, 120000, 124750, 123000, 126000, 124750]}
          onClick={() => handleMetricClick('revenue', '>100')}
        />
      </div>

      {/* Smart Insights Panel */}
      <SmartInsightsPanel />

      {/* Detailed Metrics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Engagement & Goals */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Engagement & Goals</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Details
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <MetricCard
              title="Goal Progress"
              value={`${metrics.goalProgress}%`}
              subtitle="Average goal completion"
              trend={{ value: 4.2, isPositive: true, period: 'vs last month' }}
              color="blue"
              onClick={() => handleMetricClick('goalProgress', '>60')}
            />
            <MetricCard
              title="Top Performers"
              value={metrics.topPerformers.toLocaleString()}
              subtitle="Members exceeding goals"
              trend={{ value: 8.5, isPositive: true, period: 'vs last month' }}
              color="yellow"
              onClick={() => handleMetricClick('performance', 'top')}
            />
            <MetricCard
              title="Check-ins/Week"
              value={metrics.checkinsPerWeek}
              subtitle="Average member activity"
              trend={{ value: 1.2, isPositive: true, period: 'vs last month' }}
              color="green"
              sparkline={[2.8, 3.0, 3.1, 3.2, 3.1, 3.3, 3.2]}
              onClick={() => handleMetricClick('checkins', '>3')}
            />
            <MetricCard
              title="Retention Rate"
              value={`${metrics.retentionRate}%`}
              subtitle="Member retention"
              trend={{ value: 1.8, isPositive: true, period: 'vs last month' }}
              color="green"
              sparkline={[85, 86, 87, 87.3, 87, 88, 87.3]}
              onClick={() => handleMetricClick('retention', '>80')}
            />
          </div>
        </div>

        {/* Risk & Revenue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Risk & Revenue</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Details
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <MetricCard
              title="High Risk Members"
              value={metrics.highRiskMembers}
              subtitle="Require attention"
              trend={{ value: 12.5, isPositive: false, period: 'vs last month' }}
              color="red"
              sparkline={[25, 24, 23, 23.4, 23, 22, 23.4]}
              onClick={() => handleMetricClick('riskLevel', 'high')}
            />
            <MetricCard
              title="Payment Success"
              value={`${metrics.paymentSuccess}%`}
              subtitle="Successful payments"
              trend={{ value: 0.8, isPositive: true, period: 'vs last month' }}
              color="green"
              onClick={() => handleMetricClick('paymentStatus', 'success')}
            />
            <MetricCard
              title="Overdue Amount"
              value={`$${metrics.overdueAmount.toLocaleString()}`}
              subtitle="Outstanding payments"
              trend={{ value: 15.2, isPositive: false, period: 'vs last month' }}
              color="red"
              onClick={() => handleMetricClick('overdueInvoices', true)}
            />
            <MetricCard
              title="New Members"
              value={metrics.newMembers}
              subtitle="This month"
              trend={{ value: 18.3, isPositive: true, period: 'vs last month' }}
              color="blue"
              onClick={() => handleMetricClick('joinDate', 'thisMonth')}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            title="Contact At-Risk Members"
            description="Reach out to members showing churn signals"
            action="Contact"
            count={metrics.highRiskMembers}
            icon={<FiMessageCircle className="w-4 h-4" />}
            color="red"
            onClick={() => console.log('Contact at-risk members')}
          />
          <ActionCard
            title="Reward Top Performers"
            description="Celebrate members exceeding their goals"
            action="Reward"
            count={metrics.topPerformers}
            icon={<FiGift className="w-4 h-4" />}
            color="green"
            onClick={() => console.log('Reward top performers')}
          />
          <ActionCard
            title="Export Analytics"
            description="Download comprehensive member reports"
            action="Export"
            count={1}
            icon={<FiDownload className="w-4 h-4" />}
            color="blue"
            onClick={() => console.log('Export analytics')}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab; 