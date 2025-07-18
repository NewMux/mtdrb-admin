import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign, FiActivity, FiTarget, FiZap, FiClock, FiCalendar, FiPercent } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { realtimeService } from '../../services/realtimeService';

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  targetLabel?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo';
  format: 'number' | 'currency' | 'percentage' | 'duration';
  period: 'today' | 'week' | 'month' | 'quarter';
  lastUpdated: Date;
}

interface LiveKPITrackerProps {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

export const LiveKPITracker: React.FC<LiveKPITrackerProps> = ({
  refreshInterval = 30000, // 30 seconds
  autoRefresh = true
}) => {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('today');
  const { tenantId } = useAuth();

  // Fetch live metrics
  const fetchMetrics = useCallback(async () => {
    if (!tenantId) return;

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

      let startDate: Date;
      let previousStartDate: Date;

      switch (selectedPeriod) {
        case 'today':
          startDate = startOfDay;
          previousStartDate = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000); // Yesterday
          break;
        case 'week':
          startDate = startOfWeek;
          previousStartDate = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000); // Last week
          break;
        case 'month':
          startDate = startOfMonth;
          previousStartDate = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1); // Last month
          break;
        case 'quarter':
          startDate = startOfQuarter;
          previousStartDate = new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() - 3, 1); // Last quarter
          break;
        default:
          startDate = startOfDay;
          previousStartDate = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
      }

      // Parallel data fetching for better performance
      const [
        membersData,
        classesData,
        bookingsData,
        invoicesData,
        trainersData,
        currentGymCountData
      ] = await Promise.all([
        // Members metrics
        supabase
          .from('members')
          .select('id, status, created_at, membership_type')
          .eq('tenant_id', tenantId),
        
        // Classes metrics
        supabase
          .from('classes')
          .select('id, status, start_time, current_bookings, capacity')
          .eq('tenant_id', tenantId)
          .gte('start_time', startDate.toISOString()),
        
        // Bookings metrics
        supabase
          .from('class_bookings')
          .select('id, status, check_in_time, created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', startDate.toISOString()),
        
        // Revenue metrics
        supabase
          .from('invoices')
          .select('id, amount, status, created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', startDate.toISOString()),
        
        // Trainer metrics
        supabase
          .from('trainers')
          .select('id, status, created_at')
          .eq('tenant_id', tenantId),
        
        // Current gym occupancy
        realtimeService.getLiveMemberCount(tenantId)
      ]);

      // Calculate metrics
      const currentMembers = membersData.data?.filter(m => m.status === 'active').length || 0;
      const newMembersToday = membersData.data?.filter(m => 
        new Date(m.created_at) >= startDate
      ).length || 0;

      const todayClasses = classesData.data?.length || 0;
      const classesInProgress = classesData.data?.filter(c => c.status === 'in_progress').length || 0;
      
      const totalBookings = bookingsData.data?.length || 0;
      const checkedInToday = bookingsData.data?.filter(b => 
        b.status === 'checked_in' && b.check_in_time && new Date(b.check_in_time) >= startDate
      ).length || 0;

      const todayRevenue = invoicesData.data?.reduce((sum, inv) => 
        inv.status === 'paid' ? sum + (inv.amount || 0) : sum, 0
      ) || 0;

      const activeTrainers = trainersData.data?.filter(t => t.status === 'active').length || 0;

      // Calculate utilization rate
      const totalCapacity = classesData.data?.reduce((sum, c) => sum + (c.capacity || 0), 0) || 0;
      const totalBookingsToday = classesData.data?.reduce((sum, c) => sum + (c.current_bookings || 0), 0) || 0;
      const utilizationRate = totalCapacity > 0 ? (totalBookingsToday / totalCapacity) * 100 : 0;

      // Calculate retention rate (simplified)
      const retentionRate = currentMembers > 0 ? ((currentMembers - newMembersToday) / currentMembers) * 100 : 0;

      // Revenue per member
      const revenuePerMember = currentMembers > 0 ? todayRevenue / currentMembers : 0;

      // Build metrics array
      const currentMetrics: KPIMetric[] = [
        {
          id: 'live-members',
          title: 'Members in Gym',
          value: currentGymCountData || 0,
          previousValue: 0, // Would need historical data
          change: 0,
          changePercent: 0,
          trend: 'stable',
          target: Math.ceil(currentMembers * 0.3), // 30% of total members
          targetLabel: '30% capacity',
          icon: <FiActivity className="h-5 w-5" />,
          color: 'green',
          format: 'number',
          period: selectedPeriod,
          lastUpdated: new Date()
        },
        {
          id: 'total-members',
          title: 'Total Active Members',
          value: currentMembers,
          previousValue: currentMembers - newMembersToday,
          change: newMembersToday,
          changePercent: currentMembers > 0 ? (newMembersToday / currentMembers) * 100 : 0,
          trend: newMembersToday > 0 ? 'up' : 'stable',
          target: currentMembers + 5, // Target 5 new members
          targetLabel: '+5 members',
          icon: <FiUsers className="h-5 w-5" />,
          color: 'blue',
          format: 'number',
          period: selectedPeriod,
          lastUpdated: new Date()
        },
        {
          id: 'classes-today',
          title: `Classes ${selectedPeriod === 'today' ? 'Today' : `This ${selectedPeriod}`}`,
          value: todayClasses,
          previousValue: todayClasses - classesInProgress,
          change: classesInProgress,
          changePercent: todayClasses > 0 ? (classesInProgress / todayClasses) * 100 : 0,
          trend: classesInProgress > 0 ? 'up' : 'stable',
          icon: <FiCalendar className="h-5 w-5" />,
          color: 'purple',
          format: 'number',
          period: selectedPeriod,
          lastUpdated: new Date()
        },
        {
          id: 'utilization-rate',
          title: 'Class Utilization',
          value: utilizationRate,
          previousValue: 0, // Would need historical data
          change: 0,
          changePercent: 0,
          trend: utilizationRate > 80 ? 'up' : utilizationRate > 60 ? 'stable' : 'down',
          target: 85,
          targetLabel: '85% target',
          icon: <FiPercent className="h-5 w-5" />,
          color: utilizationRate > 80 ? 'green' : utilizationRate > 60 ? 'yellow' : 'red',
          format: 'percentage',
          period: selectedPeriod,
          lastUpdated: new Date()
        },
        {
          id: 'revenue',
          title: `Revenue ${selectedPeriod === 'today' ? 'Today' : `This ${selectedPeriod}`}`,
          value: todayRevenue,
          previousValue: 0, // Would need historical data
          change: todayRevenue,
          changePercent: 0,
          trend: todayRevenue > 0 ? 'up' : 'stable',
          target: currentMembers * 15, // $15 per member target
          targetLabel: '$15/member',
          icon: <FiDollarSign className="h-5 w-5" />,
          color: 'green',
          format: 'currency',
          period: selectedPeriod,
          lastUpdated: new Date()
        },
        {
          id: 'retention-rate',
          title: 'Member Retention',
          value: retentionRate,
          previousValue: 0, // Would need historical data
          change: 0,
          changePercent: 0,
          trend: retentionRate > 90 ? 'up' : retentionRate > 80 ? 'stable' : 'down',
          target: 90,
          targetLabel: '90% target',
          icon: <FiTarget className="h-5 w-5" />,
          color: retentionRate > 90 ? 'green' : retentionRate > 80 ? 'yellow' : 'red',
          format: 'percentage',
          period: selectedPeriod,
          lastUpdated: new Date()
        },
        {
          id: 'revenue-per-member',
          title: 'Revenue per Member',
          value: revenuePerMember,
          previousValue: 0,
          change: 0,
          changePercent: 0,
          trend: revenuePerMember > 10 ? 'up' : 'stable',
          target: 15,
          targetLabel: '$15 target',
          icon: <FiZap className="h-5 w-5" />,
          color: 'indigo',
          format: 'currency',
          period: selectedPeriod,
          lastUpdated: new Date()
        },
        {
          id: 'trainer-utilization',
          title: 'Active Trainers',
          value: activeTrainers,
          previousValue: 0,
          change: 0,
          changePercent: 0,
          trend: 'stable',
          icon: <FiUsers className="h-5 w-5" />,
          color: 'blue',
          format: 'number',
          period: selectedPeriod,
          lastUpdated: new Date()
        }
      ];

      setMetrics(currentMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedPeriod]);

  // Set up real-time updates
  useEffect(() => {
    if (!tenantId) return;

    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tenantId, fetchMetrics, autoRefresh, refreshInterval]);

  // Format values based on type
  const formatValue = useCallback((value: number, format: KPIMetric['format']): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'duration':
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return `${hours}h ${minutes}m`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  }, []);

  // Get color classes for metrics
  const getColorClasses = useCallback((color: KPIMetric['color']) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    };
    return colors[color];
  }, []);

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live KPI Dashboard</h2>
          <p className="text-gray-600">Real-time metrics updated every {refreshInterval / 1000} seconds</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Live • Updated {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
                {metric.icon}
              </div>
              {metric.trend !== 'stable' && (
                <div className={`flex items-center space-x-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <FiTrendingUp className="h-4 w-4" />
                  ) : (
                    <FiTrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {metric.changePercent > 0 ? '+' : ''}
                    {metric.changePercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(metric.value, metric.format)}
              </div>
              <div className="text-sm text-gray-600">{metric.title}</div>
            </div>

            {/* Change */}
            {metric.change !== 0 && (
              <div className="text-sm text-gray-600 mb-3">
                {metric.change > 0 ? '+' : ''}{formatValue(metric.change, metric.format)} from previous period
              </div>
            )}

            {/* Target Progress */}
            {metric.target && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target</span>
                  <span className="font-medium">{metric.targetLabel}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.value >= metric.target ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min((metric.value / metric.target) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round((metric.value / metric.target) * 100)}% of target
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <FiClock className="h-3 w-3" />
                  <span>Updated {metric.lastUpdated.toLocaleTimeString()}</span>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.find(m => m.id === 'utilization-rate')?.value && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Class Utilization</div>
              <div className="text-xs text-blue-700 mt-1">
                {metrics.find(m => m.id === 'utilization-rate')!.value > 80
                  ? 'Excellent! Classes are well-attended.'
                  : metrics.find(m => m.id === 'utilization-rate')!.value > 60
                  ? 'Good utilization. Consider promotion for less popular times.'
                  : 'Low utilization. Review scheduling and marketing strategies.'
                }
              </div>
            </div>
          )}
          
          {metrics.find(m => m.id === 'live-members')?.value && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900">Current Activity</div>
              <div className="text-xs text-green-700 mt-1">
                {metrics.find(m => m.id === 'live-members')!.value} members currently in the gym
              </div>
            </div>
          )}
          
          {metrics.find(m => m.id === 'revenue')?.value && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-900">Revenue Performance</div>
              <div className="text-xs text-purple-700 mt-1">
                {formatValue(metrics.find(m => m.id === 'revenue')!.value, 'currency')} generated {selectedPeriod}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 