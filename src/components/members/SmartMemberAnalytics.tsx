import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign, FiActivity, FiAlertCircle, FiCheckCircle, FiZap, FiBarChart, FiPieChart } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../supabaseClient';
import dayjs from 'dayjs';
import { MOCK_MEMBERS } from '../../mocks/members';

interface MemberSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  value: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  insights: string[];
}

interface SmartMemberAnalyticsProps {
  refreshKey: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const generateMemberSegments = (members: any[]): MemberSegment[] => {
  const now = dayjs();
  const total = members.length;

  const segments: MemberSegment[] = [
    {
      id: 'new_members',
      name: 'New Members',
      description: 'Members who joined in the last 30 days',
      count: members.filter(m => dayjs(m.created_at).isAfter(now.subtract(30, 'days'))).length,
      percentage: 0,
      value: 0,
      trend: 'up',
      color: '#3B82F6',
      insights: ['High onboarding potential', 'Need welcome automation', 'Critical retention period']
    },
    {
      id: 'vip_members',
      name: 'VIP Members',
      description: 'High-value members with premium services',
      count: members.filter(m => parseFloat(m.membership_price || '0') > 100 && m.status === 'active').length,
      percentage: 0,
      value: 0,
      trend: 'stable',
      color: '#10B981',
      insights: ['High lifetime value', 'Upsell opportunities', 'Referral potential']
    },
    {
      id: 'at_risk',
      name: 'At-Risk Members',
      description: 'Members showing signs of potential churn',
      count: members.filter(m => {
        const lastAttendance = m.last_attendance ? dayjs(m.last_attendance) : null;
        const hasRecentAttendance = lastAttendance && lastAttendance.isAfter(now.subtract(21, 'days'));
        const hasOverduePayment = m.payment_status === 'overdue';
        const isInactive = m.status === 'inactive' || m.status === 'cancelled';
        return hasOverduePayment || isInactive || (lastAttendance && !hasRecentAttendance);
      }).length,
      percentage: 0,
      value: 0,
      trend: 'down',
      color: '#EF4444',
      insights: ['Immediate intervention needed', 'Re-engagement campaigns', 'Personal outreach']
    },
    {
      id: 'loyal_members',
      name: 'Loyal Members',
      description: 'Long-term members with consistent engagement',
      count: members.filter(m => dayjs(m.created_at).isBefore(now.subtract(6, 'months')) && m.status === 'active').length,
      percentage: 0,
      value: 0,
      trend: 'up',
      color: '#8B5CF6',
      insights: ['Advocacy potential', 'Referral candidates', 'Case study opportunities']
    }
  ];

  segments.forEach(segment => {
    segment.percentage = total > 0 ? (segment.count / total) * 100 : 0;
    const avgMembershipPrice = members.length > 0 ? 
      members.reduce((sum, m) => sum + (parseFloat(m.membership_price || '0') || 50), 0) / members.length : 50;
    segment.value = segment.count * avgMembershipPrice * 12;
  });

  return segments;
};

export default function SmartMemberAnalytics({ refreshKey }: SmartMemberAnalyticsProps) {
  // Use mock data for members
  const members = MOCK_MEMBERS;
  // Generate segments from mock data
  const segments = generateMemberSegments(members);
  // No loading state needed
  const [activeTab, setActiveTab] = useState<'overview' | 'segments'>('overview');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FiZap className="text-indigo-200" />
              Smart Member Analytics
            </h2>
            <p className="text-indigo-100 text-lg">
              AI-powered insights and behavioral analysis for smarter decisions
            </p>
          </div>
        </div>

        <div className="flex space-x-1 bg-indigo-500/30 rounded-2xl p-1">
          {[
            { id: 'overview', label: 'Overview', icon: FiBarChart },
            { id: 'segments', label: 'Segments', icon: FiPieChart }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-lg'
                  : 'text-indigo-100 hover:text-white hover:bg-indigo-500/40'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {segments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="grid gap-6">
          {segments.map(segment => (
            <motion.div
              key={segment.id}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full mt-2"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{segment.name}</h3>
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {segment.count} members
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{segment.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500 mb-1">Percentage</div>
                        <div className="text-lg font-bold text-blue-700">{segment.percentage.toFixed(1)}%</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500 mb-1">Estimated Value</div>
                        <div className="text-lg font-bold text-green-700">${segment.value.toFixed(0)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">Key Insights:</h4>
                      <div className="flex flex-wrap gap-2">
                        {segment.insights.map((insight, index) => (
                          <span 
                            key={index}
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {insight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {segment.trend === 'up' && <FiTrendingUp className="text-green-500" />}
                  {segment.trend === 'down' && <FiTrendingDown className="text-red-500" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 