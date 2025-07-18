import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart, FiTrendingUp, FiUsers, FiDollarSign, FiActivity, FiTarget, FiZap, FiFileText, FiCalendar, FiDownload, FiEye, FiMessageSquare } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

interface SmartReportAnalyticsProps {
  refreshKey: number;
}

interface ReportAnalytic {
  type: 'usage' | 'performance' | 'engagement' | 'efficiency';
  title: string;
  data: any[];
  insight: string;
}

export default function SmartReportAnalytics({ refreshKey }: SmartReportAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ReportAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportMetrics, setReportMetrics] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Generate report analytics data
      const performanceAnalytics = [
        { name: 'Financial Reports', accuracy: 98, speed: 95, satisfaction: 94 },
        { name: 'Member Reports', accuracy: 96, speed: 89, satisfaction: 92 },
        { name: 'Trainer Reports', accuracy: 94, speed: 91, satisfaction: 88 },
        { name: 'Class Reports', accuracy: 92, speed: 87, satisfaction: 86 },
        { name: 'Custom Reports', accuracy: 90, speed: 83, satisfaction: 85 }
      ];

      setAnalytics([
        {
          type: 'performance',
          title: 'Report Quality Metrics',
          data: performanceAnalytics,
          insight: 'Financial reports lead in accuracy while member reports show highest engagement'
        }
      ]);

      setReportMetrics([
        { label: 'Total Views', value: 1678, change: 45, color: 'blue' },
        { label: 'Downloads', value: 939, change: 62, color: 'green' },
        { label: 'Avg. Response Time', value: 2.3, change: -18, color: 'purple' },
        { label: 'User Satisfaction', value: 4.8, change: 12, color: 'yellow' }
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-xl">
            <FiBarChart className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Smart Report Analytics</h2>
            <p className="text-emerald-100">Performance insights and user engagement analytics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportMetrics.map((metric, index) => (
            <div key={index} className="bg-white bg-opacity-10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiActivity className="text-white" />
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold">
                {metric.label === 'Avg. Response Time' ? `${metric.value}s` : 
                 metric.label === 'User Satisfaction' ? `${metric.value}/5` : 
                 metric.value.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-200 flex items-center gap-1">
                <FiTrendingUp className="text-xs" />
                {metric.change > 0 ? '+' : ''}{metric.change}% this month
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.map((analytic, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <FiBarChart className="text-emerald-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">{analytic.title}</h3>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytic.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm text-gray-700">{analytic.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
