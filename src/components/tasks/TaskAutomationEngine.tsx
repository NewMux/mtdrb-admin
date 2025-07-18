import React from 'react';
import { motion } from 'framer-motion';

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  icon: React.ReactNode;
  triggerCount: number;
  lastTriggered: string;
  successRate: number;
  revenueImpact: string;
}

interface WorkflowCardProps {
  workflow: Workflow;
  onToggle: (id: string) => void;
  onConfigure: (id: string) => void;
  onTrigger: (id: string) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, onToggle, onConfigure, onTrigger }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'member-management':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'staff-operations':
        return 'bg-emerald-50 border-emerald-200 text-emerald-600';
      case 'facility':
        return 'bg-violet-50 border-violet-200 text-violet-600';
      case 'communication':
        return 'bg-orange-50 border-orange-200 text-orange-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className={`p-3 rounded-xl border ${getCategoryColor(workflow.category)}`}>
            {workflow.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1 tracking-tight">{workflow.name}</h3>
            <p className="text-gray-600 text-sm">{workflow.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggle(workflow.id)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              workflow.isActive ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                workflow.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium">{workflow.triggerCount}</span> triggers • Last: {workflow.lastTriggered}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onConfigure(workflow.id)}
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Configure
          </button>
          <button
            onClick={() => onTrigger(workflow.id)}
            className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Test
          </button>
        </div>
      </div>
    </div>
  );
};

interface TaskAutomationEngineProps {
  refreshKey: number;
}

const TaskAutomationEngine: React.FC<TaskAutomationEngineProps> = ({ refreshKey }) => {
  const [workflows, setWorkflows] = React.useState<Workflow[]>([
    {
      id: 'member-onboarding',
      name: 'Smart Member Onboarding',
      description: 'Automated welcome sequence with task creation for new members',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      category: 'member-management',
      isActive: true,
      triggerCount: 45,
      lastTriggered: '2 days ago',
      successRate: 92,
      revenueImpact: '+$2,400'
    },
    {
      id: 'class-preparation',
      name: 'Class Preparation Automation',
      description: 'Auto-create tasks for class setup, equipment checks, and material prep',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M19 11H5l7-6 7 6z"/><path d="M12 13v6"/><path d="M9 19h6"/></svg>,
      category: 'staff-operations',
      isActive: true,
      triggerCount: 156,
      lastTriggered: '1 hour ago',
      successRate: 88,
      revenueImpact: '+$1,800'
    },
    {
      id: 'follow-up-tasks',
      name: 'Member Follow-up Engine',
      description: 'Intelligent follow-up task creation based on member behavior',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
      category: 'member-management',
      isActive: false,
      triggerCount: 23,
      lastTriggered: '5 days ago',
      successRate: 76,
      revenueImpact: '+$950'
    },
    {
      id: 'maintenance-scheduling',
      name: 'Smart Maintenance Scheduler',
      description: 'Automated maintenance tasks based on equipment usage and schedules',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 20V10"/><path d="M12 20H7"/><path d="M12 20h7"/><path d="M12 20H7"/><path d="M12 20h7"/></svg>,
      category: 'facility',
      isActive: true,
      triggerCount: 34,
      lastTriggered: '2 days ago',
      successRate: 95,
      revenueImpact: '+$3,200'
    },
    {
      id: 'staff-task-distribution',
      name: 'Intelligent Task Distribution',
      description: 'Auto-assign tasks to staff based on availability and skills',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      category: 'staff-operations',
      isActive: true,
      triggerCount: 89,
      lastTriggered: '1 day ago',
      successRate: 91,
      revenueImpact: '+$2,100'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [showConfiguration, setShowConfiguration] = React.useState<string | null>(null);

  const handleToggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id ? { ...workflow, isActive: !workflow.isActive } : workflow
    ));
  };

  const handleConfigureWorkflow = (id: string) => {
    setShowConfiguration(id);
  };

  const handleTriggerWorkflow = (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      // Simulate triggering workflow
      alert(`Triggered: ${workflow.name}`);
    }
  };

  const categories = [
    { id: 'all', name: 'All Workflows', count: workflows.length },
    { id: 'member-management', name: 'Member Management', count: workflows.filter(w => w.category === 'member-management').length },
    { id: 'staff-operations', name: 'Staff Operations', count: workflows.filter(w => w.category === 'staff-operations').length },
    { id: 'facility', name: 'Facility', count: workflows.filter(w => w.category === 'facility').length },
    { id: 'communication', name: 'Communication', count: workflows.filter(w => w.category === 'communication').length }
  ];

  const filteredWorkflows = selectedCategory === 'all' 
    ? workflows 
    : workflows.filter(w => w.category === selectedCategory);

  const activeWorkflows = workflows.filter(w => w.isActive).length;
  const totalTriggers = workflows.reduce((sum, w) => sum + w.triggerCount, 0);
  const avgSuccessRate = Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Automation Engine</h1>
          <p className="text-gray-600 mt-1">Smart workflows to automate routine gym management tasks</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Export Report
          </button>
          <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Create Workflow
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{activeWorkflows}</p>
              <p className="text-gray-600">Active Workflows</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalTriggers}</p>
              <p className="text-gray-600">Total Triggers</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-600"><path d="M12 20V10"/><path d="M12 20H7"/><path d="M12 20h7"/><path d="M12 20H7"/><path d="M12 20h7"/></svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{avgSuccessRate}%</p>
              <p className="text-gray-600">Success Rate</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWorkflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            onToggle={handleToggleWorkflow}
            onConfigure={handleConfigureWorkflow}
            onTrigger={handleTriggerWorkflow}
          />
        ))}
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Automation Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Top Performing Workflows</h3>
            <div className="space-y-3">
              {workflows
                .sort((a, b) => b.successRate - a.successRate)
                .slice(0, 3)
                .map((workflow, index) => (
                  <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{workflow.name}</span>
                    </div>
                    <span className="text-green-600 font-bold">{workflow.successRate}%</span>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Revenue Impact</h3>
            <div className="space-y-3">
              {workflows
                .sort((a, b) => parseFloat(b.revenueImpact.replace(/[^0-9.-]/g, '')) - parseFloat(a.revenueImpact.replace(/[^0-9.-]/g, '')))
                .slice(0, 3)
                .map((workflow, index) => (
                  <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{workflow.name}</span>
                    </div>
                    <span className="text-blue-600 font-bold">{workflow.revenueImpact}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAutomationEngine; 