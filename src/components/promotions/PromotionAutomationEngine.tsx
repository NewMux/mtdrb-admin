import React, { useState } from "react";
import { FiPlay, FiPause, FiSettings, FiGift, FiHeart, FiUsers, FiCalendar, FiMail, FiTarget, FiTrendingUp, FiZap, FiCpu, FiClock, FiAward, FiPlus, FiEdit3 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface PromotionAutomationEngineProps {
  refreshKey: number;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  triggersCount: number;
  conversionRate: number;
  revenueGenerated: string;
  category: string;
  triggers: string[];
  actions: string[];
  conditions: string[];
  lastRun?: Date;
  nextRun?: Date;
}

const PromotionAutomationEngine: React.FC<PromotionAutomationEngineProps> = ({ refreshKey }) => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: "welcome-sequence",
      name: "Smart Welcome Promotion",
      description: "Automated welcome promotion sequence for new members",
      icon: <FiGift className="h-6 w-6 text-purple-600" />,
      isActive: true,
      triggersCount: 89,
      conversionRate: 34.5,
      revenueGenerated: "$4.2k",
      category: "lifecycle",
      triggers: ["New member joins"],
      actions: ["Send welcome email", "Offer 20% discount", "Schedule follow-up"],
      conditions: ["Member age < 30 days", "No previous engagement"],
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
    },
    {
      id: "win-back-campaign", 
      name: "Win-Back Promotion Engine",
      description: "Re-engage inactive members with personalized incentives",
      icon: <FiHeart className="h-6 w-6 text-red-600" />,
      isActive: true,
      triggersCount: 145,
      conversionRate: 28.3,
      revenueGenerated: "$6.8k",
      category: "retention",
      triggers: ["Member inactive for 10+ days"],
      actions: ["Send win-back email", "Offer 50% discount"],
      conditions: ["No check-ins in 10 days", "Previous engagement > 3 months"],
      lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
    },
    {
      id: "referral-automation",
      name: "Smart Referral Rewards", 
      description: "Automated referral promotion with dynamic rewards",
      icon: <FiUsers className="h-6 w-6 text-blue-600" />,
      isActive: false,
      triggersCount: 67,
      conversionRate: 42.1,
      revenueGenerated: "$3.4k",
      category: "acquisition",
      triggers: ["Member refers friend"],
      actions: ["Send referral bonus", "Track referral progress", "Celebrate milestone"],
      conditions: ["Referral joins gym", "Both members active"],
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
    },
    {
      id: "seasonal-campaigns",
      name: "Seasonal Promotion Automation",
      description: "Auto-launch seasonal promotions based on calendar events",
      icon: <FiCalendar className="h-6 w-6 text-green-600" />,
      isActive: true,
      triggersCount: 234,
      conversionRate: 31.7,
      revenueGenerated: "$8.9k",
      category: "seasonal",
      triggers: ["Holiday approaching", "Seasonal milestone"],
      actions: ["Launch seasonal campaign", "Send themed emails", "Social media posts"],
      conditions: ["Within 7 days of holiday", "Previous campaign success > 60%"],
      lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000) // 18 hours from now
    },
    {
      id: "birthday-promotions",
      name: "Birthday Celebration Automation",
      description: "Personalized birthday promotions with special offers",
      icon: <FiGift className="h-6 w-6 text-yellow-600" />,
      isActive: true,
      triggersCount: 156,
      conversionRate: 67.8,
      revenueGenerated: "$5.1k",
      category: "engagement",
      triggers: ["Member birthday approaching"],
      actions: ["Send birthday email", "Offer birthday discount"],
      conditions: ["Birthday within 3 days", "Member active in last 6 months"],
      lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeWorkflows = workflows.filter(w => w.isActive).length;
  const totalTriggers = workflows.reduce((sum, w) => sum + w.triggersCount, 0);
  const avgConversionRate = Math.round(workflows.reduce((sum, w) => sum + w.conversionRate, 0) / workflows.length);

  const automationTemplates = [
    {
      id: "birthday-promo",
      name: "Birthday Promo",
      description: "Trigger 3 days before member birthday",
      icon: <FiGift className="h-6 w-6 text-pink-600" />,
      category: "engagement"
    },
    {
      id: "churn-rescue",
      name: "Churn Rescue",
      description: "Send 50% off if user inactive for 10+ days",
      icon: <FiHeart className="h-6 w-6 text-red-600" />,
      category: "retention"
    },
    {
      id: "referral-followup",
      name: "Referral Follow-up",
      description: "Auto send follow-up if referral wasn't redeemed",
      icon: <FiUsers className="h-6 w-6 text-blue-600" />,
      category: "acquisition"
    },
    {
      id: "milestone-celebration",
      name: "Milestone Celebration",
      description: "Celebrate member milestones with rewards",
      icon: <FiAward className="h-6 w-6 text-purple-600" />,
      category: "engagement"
    }
  ];

  const handleToggleStatus = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const getTimeUntilNextRun = (nextRun: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((nextRun.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Next run: < 1 hour";
    if (diffInHours < 24) return `Next run: ${diffInHours}h`;
    return `Next run: ${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Automation Engine</h1>
          <p className="text-gray-600 mt-1">AI-powered workflows to automate your campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px] flex items-center space-x-2"
          >
            <FiPlus className="h-4 w-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{activeWorkflows}</p>
              <p className="text-gray-600">Active Workflows</p>
            </div>
            <FiPlay className="h-8 w-8 text-green-600" />
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalTriggers}</p>
              <p className="text-gray-600">Total Triggers</p>
            </div>
            <FiTarget className="h-8 w-8 text-blue-600" />
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{avgConversionRate}%</p>
              <p className="text-gray-600">Avg Conversion</p>
            </div>
            <FiTrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </motion.div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-6 border border-purple-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-xl">
                            <FiCpu className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Automation Suggestions</h2>
            <p className="text-gray-600">Smart recommendations to boost your automation</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {automationTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 transition-all text-left group"
            >
              <div className="flex items-center space-x-3 mb-2">
                {template.icon}
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  {template.category}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <motion.div
            key={workflow.id}
            whileHover={{ y: -2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-gray-50 rounded-full">
                  {workflow.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{workflow.name}</h3>
                  <p className="text-gray-600 text-sm">{workflow.description}</p>
                </div>
              </div>
              <button 
                onClick={() => handleToggleStatus(workflow.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  workflow.isActive ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  workflow.isActive ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            {/* Workflow Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <FiZap className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Triggers:</span>
                <span className="font-medium">{workflow.triggers.join(", ")}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <FiTarget className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Actions:</span>
                <span className="font-medium">{workflow.actions.join(", ")}</span>
              </div>
              {workflow.nextRun && (
                <div className="flex items-center space-x-2 text-sm">
                  <FiClock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{getTimeUntilNextRun(workflow.nextRun)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{workflow.triggersCount}</p>
                <p className="text-xs text-gray-600">Triggers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{workflow.conversionRate}%</p>
                <p className="text-xs text-gray-600">Conversion</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">{workflow.revenueGenerated}</p>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-300 ease-in-out flex items-center justify-center min-h-[44px]">
                <FiEdit3 className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button className="flex-1 px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center min-h-[44px]">
                <FiPlay className="h-4 w-4 mr-2" />
                Run Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Automation Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Top Performers</h3>
            <div className="space-y-3">
              {workflows.sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 3).map((workflow, index) => (
                <motion.div 
                  key={workflow.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{workflow.name}</span>
                  </div>
                  <span className="text-green-600 font-bold">{workflow.conversionRate}%</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Revenue Leaders</h3>
            <div className="space-y-3">
              {workflows.sort((a, b) => parseFloat(b.revenueGenerated.replace(/[^0-9.-]/g, "")) - parseFloat(a.revenueGenerated.replace(/[^0-9.-]/g, ""))).slice(0, 3).map((workflow, index) => (
                <motion.div 
                  key={workflow.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{workflow.name}</span>
                  </div>
                  <span className="text-blue-600 font-bold">{workflow.revenueGenerated}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Workflow Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Workflow</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-6">Choose a template or create a custom automation workflow</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automationTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="p-4 border border-gray-200 rounded-2xl hover:border-purple-300 transition-all text-left"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {template.icon}
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all">
                  Create Workflow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromotionAutomationEngine;
export { PromotionAutomationEngine };
