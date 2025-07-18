import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiPlay, FiPause, FiSettings, FiTrendingUp, FiCalendar, FiMail, FiDownload, FiCheckCircle, FiClock, FiFileText, FiActivity } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

interface ReportAutomationEngineProps {
  refreshKey: number;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'member' | 'trainer' | 'operational';
  status: 'active' | 'paused' | 'inactive';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  successRate: number;
  lastRun: string;
  nextRun: string;
  recipients: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AutomationMetric {
  label: string;
  value: number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function ReportAutomationEngine({ refreshKey }: ReportAutomationEngineProps) {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [metrics, setMetrics] = useState<AutomationMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    fetchAutomationData();
  }, [refreshKey]);

  const fetchAutomationData = async () => {
    setLoading(true);
    try {
      // Generate automation workflows data
      const workflowData: AutomationWorkflow[] = [
        {
          id: '1',
          name: 'Daily Revenue Summary',
          description: 'Automated daily financial performance report sent to management',
          type: 'financial',
          status: 'active',
          frequency: 'daily',
          successRate: 98,
          lastRun: '2 hours ago',
          nextRun: 'Tomorrow 8 AM',
          recipients: 5,
          icon: FiTrendingUp,
          color: 'blue'
        },
        {
          id: '2',
          name: 'Weekly Member Analytics',
          description: 'Comprehensive member engagement and retention analysis',
          type: 'member',
          status: 'active',
          frequency: 'weekly',
          successRate: 96,
          lastRun: '2 days ago',
          nextRun: 'Monday 9 AM',
          recipients: 8,
          icon: FiFileText,
          color: 'green'
        },
        {
          id: '3',
          name: 'Monthly Trainer Performance',
          description: 'Detailed trainer performance metrics and recommendations',
          type: 'trainer',
          status: 'active',
          frequency: 'monthly',
          successRate: 94,
          lastRun: '1 week ago',
          nextRun: '1st of next month',
          recipients: 12,
          icon: FiActivity,
          color: 'purple'
        },
        {
          id: '4',
          name: 'Quarterly Business Review',
          description: 'Complete business intelligence report with strategic insights',
          type: 'operational',
          status: 'paused',
          frequency: 'quarterly',
          successRate: 92,
          lastRun: '2 months ago',
          nextRun: 'Not scheduled',
          recipients: 3,
          icon: FiCheckCircle,
          color: 'orange'
        },
        {
          id: '5',
          name: 'Weekly Class Optimization',
          description: 'Class performance and scheduling optimization recommendations',
          type: 'operational',
          status: 'active',
          frequency: 'weekly',
          successRate: 89,
          lastRun: '3 days ago',
          nextRun: 'Friday 10 AM',
          recipients: 6,
          icon: FiCalendar,
          color: 'emerald'
        }
      ];

      const metricsData: AutomationMetric[] = [
        {
          label: 'Active Workflows',
          value: workflowData.filter(w => w.status === 'active').length,
          change: 25,
          icon: FiZap,
          color: 'blue'
        },
        {
          label: 'Success Rate',
          value: Math.round(workflowData.reduce((sum, w) => sum + w.successRate, 0) / workflowData.length),
          change: 12,
          icon: FiCheckCircle,
          color: 'green'
        },
        {
          label: 'Reports Generated',
          value: 247,
          change: 34,
          icon: FiFileText,
          color: 'purple'
        },
        {
          label: 'Time Saved',
          value: 156,
          change: 28,
          icon: FiClock,
          color: 'yellow'
        }
      ];

      setWorkflows(workflowData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === workflowId) {
        const newStatus = w.status === 'active' ? 'paused' : 'active';
        toast.success(`${w.name} ${newStatus === 'active' ? 'activated' : 'paused'}`);
        return { ...w, status: newStatus };
      }
      return w;
    }));
  };

  const runWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      toast.success(`${workflow.name} triggered manually`);
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, lastRun: 'Just now' } : w
      ));
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500' }
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-xl">
            <FiZap className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Report Automation Engine</h2>
            <p className="text-purple-100">Smart workflows and automated report generation</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white bg-opacity-10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className="text-white" />
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold">
                {metric.label === 'Time Saved' ? `${metric.value}h` : metric.value}
              </div>
              <div className="text-xs text-purple-200 flex items-center gap-1">
                <FiTrendingUp className="text-xs" />
                +{metric.change}% this month
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Workflows */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Smart Workflows</h3>
          <div className="flex items-center gap-2">
            <FiZap className="text-purple-600" />
            <span className="text-sm text-gray-600">Automation Engine</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map((workflow, index) => {
            const colors = getColorClasses(workflow.color);
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <workflow.icon className={colors.text} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{workflow.frequency}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      workflow.status === 'active' ? 'bg-green-500' :
                      workflow.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      workflow.status === 'active' ? 'text-green-600' :
                      workflow.status === 'paused' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {workflow.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{workflow.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div>
                    <div className="font-semibold text-gray-900">{workflow.successRate}%</div>
                    <div className="text-gray-500">Success Rate</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{workflow.recipients}</div>
                    <div className="text-gray-500">Recipients</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{workflow.lastRun}</div>
                    <div className="text-gray-500">Last Run</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{workflow.nextRun}</div>
                    <div className="text-gray-500">Next Run</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWorkflow(workflow.id)}
                    className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition ${
                      workflow.status === 'active' 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {workflow.status === 'active' ? <FiPause className="text-sm" /> : <FiPlay className="text-sm" />}
                    {workflow.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => runWorkflow(workflow.id)}
                    disabled={workflow.status !== 'active'}
                    className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition ${
                      workflow.status === 'active'
                        ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiZap className="text-sm" />
                    Run Now
                  </button>
                  
                  <button
                    onClick={() => setSelectedWorkflow(workflow.id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
                  >
                    <FiSettings className="text-sm" />
                    Configure
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Automation Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Most Reliable Workflows</h4>
            {workflows
              .sort((a, b) => b.successRate - a.successRate)
              .slice(0, 3)
              .map((workflow, index) => (
                <div key={workflow.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-bold text-gray-500">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{workflow.name}</div>
                    <div className="text-sm text-gray-600">{workflow.successRate}% success rate</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
              ))}
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Most Frequent Reports</h4>
            {workflows
              .filter(w => w.frequency === 'daily' || w.frequency === 'weekly')
              .slice(0, 3)
              .map((workflow, index) => (
                <div key={workflow.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-bold text-gray-500">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{workflow.name}</div>
                    <div className="text-sm text-gray-600">{workflow.frequency} frequency</div>
                  </div>
                  <FiCalendar className="text-blue-500" />
                </div>
              ))}
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Highest Reach</h4>
            {workflows
              .sort((a, b) => b.recipients - a.recipients)
              .slice(0, 3)
              .map((workflow, index) => (
                <div key={workflow.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-bold text-gray-500">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{workflow.name}</div>
                    <div className="text-sm text-gray-600">{workflow.recipients} recipients</div>
                  </div>
                  <FiMail className="text-green-500" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
