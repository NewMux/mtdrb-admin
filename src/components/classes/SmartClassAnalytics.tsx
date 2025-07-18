import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FiTrendingUp, FiUsers, FiCalendar, FiClock, FiTarget, 
  FiBarChart, FiPieChart, FiActivity, FiStar, FiArrowUp, 
  FiArrowDown, FiMinus, FiZap, FiTrendingDown 
} from 'react-icons/fi';


interface ClassAnalytics {
  bookingTrends: Array<{ date: string; bookings: number; revenue: number }>;
  timeSlotAnalysis: Array<{ time: string; popularity: number; revenue: number }>;
  trainerPerformance: Array<{ name: string; classes: number; bookings: number; rating: number }>;
  memberSegmentation: Array<{ segment: string; count: number; revenue: number }>;
  classTypeAnalysis: Array<{ type: string; bookings: number; revenue: number; color: string }>;
  seasonalTrends: Array<{ month: string; bookings: number; capacity: number }>;
  predictiveMetrics: {
    nextMonthBookings: number;
    revenueGrowth: number;
    capacityForecast: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    metric: string;
    change: number;
  }>;
}

interface SmartClassAnalyticsProps {
  refreshKey: number;
}

export default function SmartClassAnalytics({ refreshKey }: SmartClassAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ClassAnalytics>({
    bookingTrends: [],
    timeSlotAnalysis: [],
    trainerPerformance: [],
    memberSegmentation: [],
    classTypeAnalysis: [],
    seasonalTrends: [],
    predictiveMetrics: {
      nextMonthBookings: 0,
      revenueGrowth: 0,
      capacityForecast: 0,
      trendDirection: 'stable',
    },
    insights: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock analytics data for demonstration
      const bookingTrends = generateBookingTrends();
      const timeSlotAnalysis = generateTimeSlotAnalysis();
      const trainerPerformance = generateTrainerPerformance();
      const memberSegmentation = generateMemberSegmentation();
      const classTypeAnalysis = generateClassTypeAnalysis();
      const seasonalTrends = generateSeasonalTrends();
      const predictiveMetrics = generatePredictiveMetrics();
      const insights = generateInsights();

      setAnalytics({
        bookingTrends,
        timeSlotAnalysis,
        trainerPerformance,
        memberSegmentation,
        classTypeAnalysis,
        seasonalTrends,
        predictiveMetrics,
        insights,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBookingTrends = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      bookings: Math.floor(Math.random() * 25) + 10,
      revenue: Math.floor(Math.random() * 500) + 200,
    }));
  };

  const generateTimeSlotAnalysis = () => {
    return [
      { time: '6-9 AM', popularity: 85, revenue: 1200 },
      { time: '9-12 PM', popularity: 65, revenue: 800 },
      { time: '12-3 PM', popularity: 45, revenue: 600 },
      { time: '3-6 PM', popularity: 70, revenue: 950 },
      { time: '6-9 PM', popularity: 95, revenue: 1500 },
      { time: '9+ PM', popularity: 30, revenue: 400 },
    ];
  };

  const generateTrainerPerformance = () => {
    return [
      { name: 'Sarah Johnson', classes: 12, bookings: 95, rating: 4.8 },
      { name: 'Mike Chen', classes: 8, bookings: 78, rating: 4.6 },
      { name: 'Emma Davis', classes: 10, bookings: 85, rating: 4.9 },
      { name: 'James Wilson', classes: 6, bookings: 62, rating: 4.4 },
    ];
  };

  const generateMemberSegmentation = () => {
    return [
      { segment: 'Regular Members', count: 180, revenue: 3600 },
      { segment: 'VIP Members', count: 45, revenue: 2250 },
      { segment: 'Trial Members', count: 32, revenue: 320 },
      { segment: 'Inactive Members', count: 28, revenue: 0 },
    ];
  };

  const generateClassTypeAnalysis = () => {
    return [
      { type: 'Yoga', bookings: 85, revenue: 1700, color: '#8B5CF6' },
      { type: 'HIIT', bookings: 92, revenue: 1840, color: '#EF4444' },
      { type: 'Pilates', bookings: 67, revenue: 1340, color: '#10B981' },
      { type: 'Cardio', bookings: 78, revenue: 1560, color: '#F59E0B' },
      { type: 'Strength', bookings: 73, revenue: 1460, color: '#3B82F6' },
    ];
  };

  const generateSeasonalTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      bookings: Math.floor(Math.random() * 200) + 150,
      capacity: Math.floor(Math.random() * 50) + 300,
    }));
  };

  const generatePredictiveMetrics = () => {
    return {
      nextMonthBookings: 150,
      revenueGrowth: 12.5,
      capacityForecast: 78,
      trendDirection: 'up' as const,
    };
  };

  const generateInsights = () => {
    return [
      {
        type: 'positive' as const,
        title: 'Peak Performance',
        description: 'Evening classes show 25% higher attendance',
        metric: 'Attendance Rate',
        change: 25,
      },
      {
        type: 'negative' as const,
        title: 'Low Utilization',
        description: 'Afternoon slots are underutilized',
        metric: 'Capacity Usage',
        change: -15,
      },
      {
        type: 'positive' as const,
        title: 'Revenue Growth',
        description: 'Monthly revenue increased significantly',
        metric: 'Revenue',
        change: 18,
      },
      {
        type: 'neutral' as const,
        title: 'Stable Trends',
        description: 'Weekend bookings remain consistent',
        metric: 'Weekend Bookings',
        change: 2,
      },
    ];
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Class Analytics</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.insights.map((insight, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-2xl shadow p-4 border-l-4 border-blue-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{insight.metric}</span>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    insight.change > 0 ? 'text-green-600' : 
                    insight.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {insight.change > 0 ? <FiArrowUp size={12} /> : 
                     insight.change < 0 ? <FiArrowDown size={12} /> : <FiMinus size={12} />}
                    {Math.abs(insight.change)}%
                  </div>
                </div>
              </div>
              <div className={`p-2 rounded-lg ${
                insight.type === 'positive' ? 'bg-green-100' :
                insight.type === 'negative' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {insight.type === 'positive' ? 
                  <FiTrendingUp className="text-green-600" /> :
                  insight.type === 'negative' ?
                  <FiTrendingDown className="text-red-600" /> :
                  <FiActivity className="text-gray-600" />
                }
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Booking Trends */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiTrendingUp className="text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900">Booking Trends</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analytics.bookingTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="bookings" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="revenue" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time Slot Analysis & Class Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiClock className="text-purple-500" />
            <h3 className="text-lg font-bold text-gray-900">Time Slot Popularity</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.timeSlotAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="popularity" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiPieChart className="text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900">Class Type Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.classTypeAnalysis}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="bookings"
              >
                {analytics.classTypeAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trainer Performance */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiStar className="text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900">Trainer Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.trainerPerformance.map((trainer, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{trainer.name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Classes</span>
                  <span className="font-medium">{trainer.classes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bookings</span>
                  <span className="font-medium">{trainer.bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-500 fill-current" size={12} />
                    <span className="font-medium">{trainer.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Trends & Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiCalendar className="text-green-500" />
            <h3 className="text-lg font-bold text-gray-900">Seasonal Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.seasonalTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="capacity" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiZap className="text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900">Predictive Metrics</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-900 font-medium">Next Month Bookings</span>
                <span className="text-2xl font-bold text-blue-600">
                  {Math.round(analytics.predictiveMetrics.nextMonthBookings)}
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">15% increase predicted</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-green-900 font-medium">Revenue Growth</span>
                <span className="text-2xl font-bold text-green-600">
                  {analytics.predictiveMetrics.revenueGrowth}%
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">Above industry average</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-purple-900 font-medium">Capacity Forecast</span>
                <span className="text-2xl font-bold text-purple-600">
                  {analytics.predictiveMetrics.capacityForecast}%
                </span>
              </div>
              <p className="text-sm text-purple-600 mt-1">Optimal utilization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 