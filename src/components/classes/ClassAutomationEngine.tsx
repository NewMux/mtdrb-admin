import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap,
  FiPlay,
  FiPause,
  FiSettings,
  FiUsers,
  FiCalendar,
  FiClock,
  FiBell,
  FiTrendingUp,
  FiTarget,
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiAlertTriangle,
  FiBarChart,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  type: "booking" | "reminder" | "optimization" | "marketing" | "analytics";
  status: "active" | "paused" | "draft";
  icon: React.ElementType;
  color: string;
  bgColor: string;
  triggers: string[];
  actions: string[];
  stats: {
    triggered: number;
    successful: number;
    revenue: number;
    lastRun: string;
  };
  settings: Record<string, any>;
}

interface ClassAutomationEngineProps {
  refreshKey: number;
}

export default function ClassAutomationEngine({
  refreshKey,
}: ClassAutomationEngineProps) {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<AutomationWorkflow | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  // Predefined smart workflows
  const defaultWorkflows: AutomationWorkflow[] = [
    {
      id: "smart-booking-reminders",
      name: "Smart Booking Reminders",
      description:
        "Automatically send personalized reminders 24h before class time with custom messages based on member preferences.",
      type: "reminder",
      status: "active",
      icon: FiBell,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      triggers: [
        "24 hours before class",
        "Member books class",
        "Class changes",
      ],
      actions: [
        "Send SMS reminder",
        "Send email notification",
        "Push notification",
        "Add to calendar",
      ],
      stats: {
        triggered: 127,
        successful: 119,
        revenue: 0,
        lastRun: "2 hours ago",
      },
      settings: {
        reminderTime: 24,
        channels: ["email", "sms"],
        personalizedMessages: true,
        weatherIntegration: true,
      },
    },
    {
      id: "class-capacity-optimizer",
      name: "Class Capacity Optimizer",
      description:
        "Automatically adjust class capacity and create additional sessions when demand is high. Smart waitlist management.",
      type: "optimization",
      status: "active",
      icon: FiTarget,
      color: "text-green-600",
      bgColor: "bg-green-50",
      triggers: [
        "90% capacity reached",
        "Waitlist > 5 people",
        "High demand pattern",
      ],
      actions: [
        "Create additional session",
        "Increase capacity",
        "Notify trainers",
        "Auto-book from waitlist",
      ],
      stats: {
        triggered: 23,
        successful: 21,
        revenue: 1840,
        lastRun: "6 hours ago",
      },
      settings: {
        capacityThreshold: 90,
        waitlistThreshold: 5,
        autoCreateSessions: true,
        trainerNotification: true,
      },
    },
    {
      id: "smart-class-scheduling",
      name: "Smart Class Scheduling",
      description:
        "Smart-powered scheduling that analyzes member preferences, trainer availability, and historical data to optimize class times.",
      type: "optimization",
      status: "active",
      icon: FiCalendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      triggers: [
        "Weekly schedule review",
        "Low attendance pattern",
        "Trainer availability change",
      ],
      actions: [
        "Suggest optimal times",
        "Auto-reschedule",
        "Send schedule updates",
        "Notify affected members",
      ],
      stats: {
        triggered: 8,
        successful: 7,
        revenue: 560,
        lastRun: "1 day ago",
      },
      settings: {
        aiOptimization: true,
        memberPreferences: true,
        trainerAvailability: true,
        historicalData: true,
      },
    },
    {
      id: "class-marketing-automation",
      name: "Class Marketing Automation",
      description:
        "Promote underperforming classes with targeted campaigns. Special offers for members who haven't booked recently.",
      type: "marketing",
      status: "active",
      icon: FiTrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      triggers: [
        "Class < 50% capacity",
        "Member inactive 2 weeks",
        "New class launch",
      ],
      actions: [
        "Send promotional email",
        "Create discount code",
        "Social media post",
        "In-app notification",
      ],
      stats: {
        triggered: 34,
        successful: 29,
        revenue: 2340,
        lastRun: "4 hours ago",
      },
      settings: {
        discountPercentage: 15,
        targetAudience: "inactive_members",
        campaignDuration: 7,
        maxPromotions: 3,
      },
    },
    {
      id: "attendance-tracking-automation",
      name: "Attendance Tracking & Follow-up",
      description:
        "Track no-shows automatically and send follow-up messages. Manage cancellation policies and waitlist promotion.",
      type: "analytics",
      status: "active",
      icon: FiUsers,
      color: "text-red-600",
      bgColor: "bg-red-50",
      triggers: ["Member no-show", "Last-minute cancellation", "Class ends"],
      actions: [
        "Mark attendance",
        "Send follow-up",
        "Apply penalties",
        "Promote from waitlist",
      ],
      stats: {
        triggered: 67,
        successful: 64,
        revenue: 0,
        lastRun: "30 minutes ago",
      },
      settings: {
        noShowPenalty: true,
        followUpDelay: 2,
        waitlistPromotion: true,
        attendanceRewards: false,
      },
    },
  ];

  useEffect(() => {
    loadWorkflows();
  }, [user, refreshKey]);

  const loadWorkflows = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // For now, use default workflows. In production, load from database
      setWorkflows(defaultWorkflows);
    } catch (error) {
      console.error("Error loading workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === workflowId
          ? { ...w, status: w.status === "active" ? "paused" : "active" }
          : w,
      ),
    );
  };

  const triggerWorkflow = async (workflowId: string) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    // Simulate workflow execution
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              stats: {
                ...w.stats,
                triggered: w.stats.triggered + 1,
                successful: w.stats.successful + 1,
                lastRun: "Just now",
              },
            }
          : w,
      ),
    );

    // Show success message
    setTimeout(() => {
      alert(`Workflow "${workflow.name}" executed successfully!`);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Automation Overview */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <FiZap className="text-indigo-600 text-xl" />
          <h3 className="text-lg font-bold text-indigo-900">
            Class Automation Engine
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-900">
              {workflows.filter((w) => w.status === "active").length}
            </p>
            <p className="text-sm text-indigo-600">Active Workflows</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-900">
              {workflows.reduce((sum, w) => sum + w.stats.triggered, 0)}
            </p>
            <p className="text-sm text-green-600">Total Executions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-900">
              {Math.round(
                (workflows.reduce((sum, w) => sum + w.stats.successful, 0) /
                  Math.max(
                    workflows.reduce((sum, w) => sum + w.stats.triggered, 0),
                    1,
                  )) *
                  100,
              )}
              %
            </p>
            <p className="text-sm text-purple-600">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-900">
              ${workflows.reduce((sum, w) => sum + w.stats.revenue, 0)}
            </p>
            <p className="text-sm text-orange-600">Revenue Generated</p>
          </div>
        </div>
      </div>

      {/* Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <motion.div
            key={workflow.id}
            className="bg-white rounded-2xl shadow p-6 border hover:shadow-lg transition-all"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${workflow.bgColor} rounded-lg`}>
                  <workflow.icon className={workflow.color} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{workflow.name}</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {workflow.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Last run: {workflow.stats.lastRun}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleWorkflow(workflow.id)}
                className={`p-2 rounded-lg transition-colors ${
                  workflow.status === "active"
                    ? "bg-green-100 text-green-600 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {workflow.status === "active" ? <FiPause /> : <FiPlay />}
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{workflow.description}</p>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-900">
                  {workflow.stats.triggered}
                </p>
                <p className="text-xs text-gray-600">Triggered</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-900">
                  {workflow.stats.successful}
                </p>
                <p className="text-xs text-gray-600">Successful</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-900">
                  {workflow.stats.revenue > 0
                    ? `$${workflow.stats.revenue}`
                    : "-"}
                </p>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </div>

            {/* Triggers & Actions */}
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Triggers
                </p>
                <div className="flex flex-wrap gap-1">
                  {workflow.triggers.slice(0, 2).map((trigger, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                      {trigger}
                    </span>
                  ))}
                  {workflow.triggers.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{workflow.triggers.length - 2} more
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Actions
                </p>
                <div className="flex flex-wrap gap-1">
                  {workflow.actions.slice(0, 2).map((action, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                    >
                      {action}
                    </span>
                  ))}
                  {workflow.actions.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{workflow.actions.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => triggerWorkflow(workflow.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 ease-in-out text-sm font-semibold min-h-[44px]"
              >
                Run Now
              </button>
              <button
                onClick={() => {
                  setSelectedWorkflow(workflow);
                  setShowSettings(true);
                }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-300 ease-in-out min-h-[44px]"
              >
                <FiSettings className="text-gray-600" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && selectedWorkflow && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedWorkflow.name} Settings
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {Object.entries(selectedWorkflow.settings).map(
                    ([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </label>
                        {typeof value === "boolean" ? (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={value}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              Enable this feature
                            </span>
                          </label>
                        ) : typeof value === "number" ? (
                          <input
                            type="number"
                            defaultValue={value}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <input
                            type="text"
                            defaultValue={value}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
                    Save Settings
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-300 ease-in-out min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
