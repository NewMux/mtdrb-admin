import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiMail, FiUsers, FiPlay, FiPause, FiEdit, FiTrash2, FiPlus, FiSettings, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

interface ScheduledReportsProps {
  refreshKey: number;
}

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRun: string;
  lastRun: string;
  status: 'active' | 'paused' | 'error';
  recipients: string[];
  reportType: string;
  deliveryMethod: 'email' | 'dashboard' | 'download';
  format: 'pdf' | 'csv' | 'excel';
  successRate: number;
}

interface ReportMetric {
  label: string;
  value: number;
  change: number;
  color: string;
}

export default function ScheduledReports({ refreshKey }: ScheduledReportsProps) {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);

  useEffect(() => {
    fetchScheduledReports();
  }, [refreshKey]);

  const fetchScheduledReports = async () => {
    setLoading(true);
    try {
      // Generate scheduled reports data
      const reportsData: ScheduledReport[] = [
        {
          id: '1',
          name: 'Daily Revenue Summary',
          description: 'Daily financial performance and key metrics',
          frequency: 'daily',
          nextRun: 'Tomorrow at 8:00 AM',
          lastRun: '2 hours ago',
          status: 'active',
          recipients: ['manager@gym.com', 'finance@gym.com'],
          reportType: 'Financial Report',
          deliveryMethod: 'email',
          format: 'pdf',
          successRate: 98
        },
        {
          id: '2',
          name: 'Weekly Member Analytics',
          description: 'Comprehensive member engagement and retention analysis',
          frequency: 'weekly',
          nextRun: 'Monday at 9:00 AM',
          lastRun: '2 days ago',
          status: 'active',
          recipients: ['membership@gym.com', 'analytics@gym.com'],
          reportType: 'Member Report',
          deliveryMethod: 'email',
          format: 'excel',
          successRate: 96
        },
        {
          id: '3',
          name: 'Monthly Trainer Performance',
          description: 'Detailed trainer metrics and performance review',
          frequency: 'monthly',
          nextRun: '1st of next month at 10:00 AM',
          lastRun: '1 week ago',
          status: 'active',
          recipients: ['hr@gym.com', 'trainers@gym.com'],
          reportType: 'Trainer Report',
          deliveryMethod: 'dashboard',
          format: 'pdf',
          successRate: 94
        },
        {
          id: '4',
          name: 'Quarterly Business Review',
          description: 'Complete business intelligence and strategic insights',
          frequency: 'quarterly',
          nextRun: 'April 1st at 9:00 AM',
          lastRun: '2 months ago',
          status: 'paused',
          recipients: ['executive@gym.com'],
          reportType: 'Business Report',
          deliveryMethod: 'email',
          format: 'pdf',
          successRate: 92
        },
        {
          id: '5',
          name: 'Weekly Class Optimization',
          description: 'Class performance and scheduling recommendations',
          frequency: 'weekly',
          nextRun: 'Friday at 10:00 AM',
          lastRun: '3 days ago',
          status: 'active',
          recipients: ['operations@gym.com', 'scheduling@gym.com'],
          reportType: 'Operational Report',
          deliveryMethod: 'email',
          format: 'csv',
          successRate: 89
        },
        {
          id: '6',
          name: 'Daily Equipment Status',
          description: 'Equipment maintenance and utilization report',
          frequency: 'daily',
          nextRun: 'Tomorrow at 6:00 AM',
          lastRun: 'Failed - Connection Error',
          status: 'error',
          recipients: ['maintenance@gym.com'],
          reportType: 'Operational Report',
          deliveryMethod: 'email',
          format: 'pdf',
          successRate: 85
        }
      ];

      const metricsData: ReportMetric[] = [
        { label: 'Active Reports', value: reportsData.filter(r => r.status === 'active').length, change: 20, color: 'blue' },
        { label: 'Success Rate', value: Math.round(reportsData.reduce((sum, r) => sum + r.successRate, 0) / reportsData.length), change: 5, color: 'green' },
        { label: 'Total Recipients', value: Array.from(new Set(reportsData.flatMap(r => r.recipients))).length, change: 15, color: 'purple' },
        { label: 'Reports This Week', value: 24, change: 12, color: 'orange' }
      ];

      setScheduledReports(reportsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReportStatus = async (reportId: string) => {
    setScheduledReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const newStatus = report.status === 'active' ? 'paused' : 'active';
        toast.success(`Report ${newStatus === 'active' ? 'activated' : 'paused'}`);
        return { ...report, status: newStatus };
      }
      return report;
    }));
  };

  const deleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      setScheduledReports(prev => prev.filter(report => report.id !== reportId));
      toast.success('Scheduled report deleted');
    }
  };

  const getStatusColor = (status: ScheduledReport['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ScheduledReport['status']) => {
    switch (status) {
      case 'active': return FiCheckCircle;
      case 'paused': return FiPause;
      case 'error': return FiAlertCircle;
      default: return FiClock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiCalendar className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Scheduled Reports</h2>
              <p className="text-teal-100">Automated report delivery and scheduling management</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition"
          >
            <FiPlus className="text-sm" />
            Schedule Report
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white bg-opacity-10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiCalendar className="text-white" />
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs text-teal-200 flex items-center gap-1">
                <span>+{metric.change}% this month</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports List */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Schedules</h3>
          <div className="flex items-center gap-2">
            <FiClock className="text-teal-600" />
            <span className="text-sm text-gray-600">Auto-Generated Reports</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {scheduledReports.map((report, index) => {
            const StatusIcon = getStatusIcon(report.status);
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(report.status)}`}>
                      <StatusIcon className="text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-gray-500">Frequency</div>
                    <div className="font-medium capitalize">{report.frequency}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Next Run</div>
                    <div className="font-medium">{report.nextRun}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Recipients</div>
                    <div className="font-medium">{report.recipients.length} users</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Success Rate</div>
                    <div className="font-medium">{report.successRate}%</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FiMail className="text-xs" />
                      {report.deliveryMethod}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiSettings className="text-xs" />
                      {report.format.toUpperCase()}
                    </span>
                    <span>Last: {report.lastRun}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReportStatus(report.id)}
                      className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition ${
                        report.status === 'active' 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {report.status === 'active' ? <FiPause className="text-xs" /> : <FiPlay className="text-xs" />}
                      {report.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
                    >
                      <FiEdit className="text-xs" />
                      Edit
                    </button>
                    
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
                    >
                      <FiTrash2 className="text-xs" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Delivery Methods</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-gray-600">
                <FiMail className="text-sm" />
                Email
              </span>
              <span className="font-medium">
                {scheduledReports.filter(r => r.deliveryMethod === 'email').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-gray-600">
                <FiSettings className="text-sm" />
                Dashboard
              </span>
              <span className="font-medium">
                {scheduledReports.filter(r => r.deliveryMethod === 'dashboard').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-gray-600">
                <FiUsers className="text-sm" />
                Download
              </span>
              <span className="font-medium">
                {scheduledReports.filter(r => r.deliveryMethod === 'download').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Frequency Distribution</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Daily</span>
              <span className="font-medium">
                {scheduledReports.filter(r => r.frequency === 'daily').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Weekly</span>
              <span className="font-medium">
                {scheduledReports.filter(r => r.frequency === 'weekly').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly</span>
              <span className="font-medium">
                {scheduledReports.filter(r => r.frequency === 'monthly').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quarterly</span>
              <span className="font-medium">
                {scheduledReports.filter(r => r.frequency === 'quarterly').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Performance Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg. Success Rate</span>
              <span className="font-medium text-green-600">
                {Math.round(scheduledReports.reduce((sum, r) => sum + r.successRate, 0) / scheduledReports.length)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Reports</span>
              <span className="font-medium text-blue-600">
                {scheduledReports.filter(r => r.status === 'active').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Error Reports</span>
              <span className="font-medium text-red-600">
                {scheduledReports.filter(r => r.status === 'error').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
