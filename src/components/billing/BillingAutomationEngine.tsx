import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiZap, FiPlay, FiPause, FiSettings, FiUsers, FiDollarSign,
  FiClock, FiAlertCircle, FiTrendingUp, FiTarget, FiRepeat, 
  FiSend, FiActivity, FiBarChart, FiPlus, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface BillingAutomationEngineProps {
  refreshKey: number;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  type: 'payment_reminder' | 'overdue_collection' | 'subscription_renewal' | 'upsell' | 'welcome';
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  actions: string[];
  success_rate: number;
  revenue_impact: number;
  last_run: string;
  next_run: string;
  executions: number;
}

// Helper function to safely format numbers
const safeToLocaleString = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString();
};

// Helper function to safely format currency
const safeCurrencyFormat = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0 AED';
  return `${value.toLocaleString()} AED`;
};

export default function BillingAutomationEngine({ refreshKey }: BillingAutomationEngineProps) {
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);

  useEffect(() => {
    fetchAutomationData();
  }, [refreshKey]);

  const fetchAutomationData = async () => {
    try {
      setLoading(true);
      
      // Mock automation workflows data
      const mockWorkflows: AutomationWorkflow[] = [
        {
          id: 'wf-001',
          name: 'Payment Reminder',
          description: 'Automatically sends payment reminders to members with overdue invoices',
          type: 'payment_reminder',
          status: 'active',
          trigger: 'Invoice overdue by 3 days',
          actions: ['Send email reminder'],
          success_rate: 85.5,
          revenue_impact: 12500,
          last_run: '2024-06-20T10:00:00Z',
          next_run: '2024-06-23T10:00:00Z',
          executions: 45
        },
        {
          id: 'wf-002',
          name: 'Subscription Renewal',
          description: 'Automatically processes subscription renewals and sends confirmation',
          type: 'subscription_renewal',
          status: 'active',
          trigger: 'Subscription expires in 7 days',
          actions: ['Send renewal notice', 'Process payment', 'Update membership'],
          success_rate: 92.3,
          revenue_impact: 18500,
          last_run: '2024-06-19T14:30:00Z',
          next_run: '2024-06-26T14:30:00Z',
          executions: 28
        },
        {
          id: 'wf-003',
          name: 'Welcome Series',
          description: 'Sends welcome emails and onboarding materials to new members',
          type: 'welcome',
          status: 'active',
          trigger: 'New member registration',
          actions: ['Send welcome email', 'Schedule orientation call'],
          success_rate: 78.9,
          revenue_impact: 3200,
          last_run: '2024-06-18T09:15:00Z',
          next_run: '2024-06-25T09:15:00Z',
          executions: 12
        },
        {
          id: 'wf-004',
          name: 'Upsell Campaign',
          description: 'Targets members for premium membership upgrades',
          type: 'upsell',
          status: 'paused',
          trigger: 'Member active for 30 days',
          actions: ['Send upgrade offer', 'Schedule consultation call'],
          success_rate: 45.2,
          revenue_impact: 8900,
          last_run: '2024-06-15T16:45:00Z',
          next_run: '2024-06-22T16:45:00Z',
          executions: 33
        },
        {
          id: 'wf-005',
          name: 'Overdue Collection',
          description: 'Aggressive collection process for severely overdue invoices',
          type: 'overdue_collection',
          status: 'active',
          trigger: 'Invoice overdue by 30 days',
          actions: ['Send final notice', 'Call member', 'Send to collections'],
          success_rate: 67.8,
          revenue_impact: 15600,
          last_run: '2024-06-17T11:20:00Z',
          next_run: '2024-06-24T11:20:00Z',
          executions: 19
        }
      ];

      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Error loading automation data:', error);
      toast.error('Failed to load automation data');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, status: newStatus } : w
      ));

      toast.success(`Workflow ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to update workflow status');
    }
  };

  const runWorkflowNow = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      toast.success(`Running "${workflow.name}" workflow...`);
      
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { 
          ...w, 
          executions: w.executions + 1,
          last_run: new Date().toISOString()
        } : w
      ));
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error('Failed to run workflow');
    }
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder': return FiClock;
      case 'overdue_collection': return FiAlertCircle;
      case 'subscription_renewal': return FiRepeat;
      case 'upsell': return FiTrendingUp;
      case 'welcome': return FiUsers;
      default: return FiZap;
    }
  };

  const getWorkflowColor = (type: string) => {
    switch (type) {
      case 'payment_reminder': return 'from-blue-500 to-blue-600';
      case 'overdue_collection': return 'from-red-500 to-red-600';
      case 'subscription_renewal': return 'from-green-500 to-green-600';
      case 'upsell': return 'from-purple-500 to-purple-600';
      case 'welcome': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading automation workflows...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Automation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiZap className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Active Workflows</div>
              <div className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</div>
            </div>
          </div>
          <div className="text-sm opacity-90">
            {workflows.filter(w => w.status === 'paused').length} paused
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiDollarSign className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Revenue Impact</div>
              <div className="text-2xl font-bold">
                {safeCurrencyFormat(workflows.reduce((sum, w) => sum + (w.revenue_impact || 0), 0))}
              </div>
            </div>
          </div>
          <div className="text-sm opacity-90">This month</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiActivity className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Success Rate</div>
              <div className="text-2xl font-bold">
                {workflows.length > 0 
                  ? (workflows.reduce((sum, w) => sum + (w.success_rate || 0), 0) / workflows.length).toFixed(1)
                  : '0.0'
                }%
              </div>
            </div>
          </div>
          <div className="text-sm opacity-90">Average across all workflows</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiBarChart className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Total Executions</div>
              <div className="text-2xl font-bold">
                {safeToLocaleString(workflows.reduce((sum, w) => sum + (w.executions || 0), 0))}
              </div>
            </div>
          </div>
          <div className="text-sm opacity-90">All time</div>
        </motion.div>
      </div>

      {/* Workflow Management */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-xl">
                <FiSettings className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Automation Workflows</h3>
                <p className="text-gray-600 text-sm">Manage your billing automation processes</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ease-in-out min-h-[44px]">
              <FiZap className="h-4 w-4" />
              Create Workflow
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map((workflow, index) => {
              const Icon = getWorkflowIcon(workflow.type);
              return (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`bg-gradient-to-r ${getWorkflowColor(workflow.type)} p-3 rounded-xl`}>
                        <Icon className="text-white text-xl" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{workflow.name}</h4>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      workflow.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : workflow.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Success Rate</div>
                      <div className="text-lg font-bold text-green-600">{workflow.success_rate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Revenue Impact</div>
                      <div className="text-lg font-bold text-blue-600">
                        {safeCurrencyFormat(workflow.revenue_impact)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Trigger: {workflow.trigger}</div>
                    <div className="flex flex-wrap gap-1">
                      {workflow.actions.map((action, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <div>Executions: {safeToLocaleString(workflow.executions)}</div>
                      <div>Last run: {workflow.last_run ? new Date(workflow.last_run).toLocaleDateString() : 'Never'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runWorkflowNow(workflow.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Run now"
                      >
                        <FiPlay />
                      </button>
                      <button
                        onClick={() => toggleWorkflowStatus(workflow.id)}
                        className={`p-2 rounded-lg transition ${
                          workflow.status === 'active'
                            ? 'text-yellow-600 hover:bg-yellow-100'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={workflow.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {workflow.status === 'active' ? <FiPause /> : <FiPlay />}
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Settings"
                      >
                        <FiSettings />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-500 p-3 rounded-xl">
            <FiTarget className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <p className="text-gray-600 text-sm">Common automation tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all duration-300 ease-in-out text-left min-h-[44px]">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiZap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Payment Reminders</h3>
                    <p className="text-sm text-gray-600">Automated payment reminders</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all duration-300 ease-in-out text-left min-h-[44px]">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Invoice Generation</h3>
                    <p className="text-sm text-gray-600">Automatic invoice creation</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all duration-300 ease-in-out text-left min-h-[44px]">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiTrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Revenue Tracking</h3>
                    <p className="text-sm text-gray-600">Real-time revenue analytics</p>
                  </div>
                </button>
        </div>
      </motion.div>
    </div>
  );
} 