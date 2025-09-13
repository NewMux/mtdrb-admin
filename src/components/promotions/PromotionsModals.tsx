import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiGift,
  FiUsers,
  FiCalendar,
  FiTarget,
  FiZap,
  FiCpu,
  FiCopy,
  FiEye,
  FiPlay,
  FiSettings,
  FiTrendingUp,
  FiAward,
  FiMail,
  FiPhone,
  FiSmartphone,
  FiShare2,
  FiCheck,
} from "react-icons/fi";

// Types
interface CampaignType {
  id?: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed" | "free";
  discountValue: string;
  audience: string;
  channels: string[];
  startDate: string;
  endDate: string;
  aiCopy: string;
  enableAutomation?: boolean;
}

interface WorkflowType {
  id?: string;
  name: string;
  trigger: string;
  audience: string[];
  actions: string[];
  isActive: boolean;
}

// Campaign Builder Modal
interface CampaignBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: CampaignType;
}

export const CampaignBuilderModal: React.FC<CampaignBuilderModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const [formData, setFormData] = useState<CampaignType>({
    name: template?.name || "",
    description: template?.description || "",
    discountType: template?.discountType || "percentage",
    discountValue: template?.discountValue || "",
    audience: template?.audience || "",
    channels: template?.channels || [],
    startDate: template?.startDate || "",
    endDate: template?.endDate || "",
    aiCopy: template?.aiCopy || "",
    enableAutomation: template?.enableAutomation || false,
  });

  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  const audienceOptions = [
    { value: "new-members", label: "New Members (< 30 days)", count: 45 },
    {
      value: "active-members",
      label: "Active Members (3+ visits/week)",
      count: 180,
    },
    {
      value: "inactive-members",
      label: "Inactive Members (> 14 days)",
      count: 67,
    },
    {
      value: "frequent-visitors",
      label: "Frequent Visitors (5+ visits/week)",
      count: 120,
    },
    {
      value: "low-engagement",
      label: "Low Engagement (< 2 visits/month)",
      count: 89,
    },
    { value: "all-members", label: "All Members", count: 921 },
  ];

  const channelOptions = [
    {
      value: "email",
      label: "Email",
      icon: <FiMail className="h-4 w-4" />,
      reach: "85%",
    },
    {
      value: "push",
      label: "Push Notifications",
      icon: <FiSmartphone className="h-4 w-4" />,
      reach: "70%",
    },
    {
      value: "in-app",
      label: "In-App",
      icon: <FiTarget className="h-4 w-4" />,
      reach: "60%",
    },
    {
      value: "social",
      label: "Social Media",
      icon: <FiShare2 className="h-4 w-4" />,
      reach: "40%",
    },
  ];

  const generateAICopy = async () => {
    setIsGeneratingCopy(true);
    // Simulate AI copy generation
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        aiCopy:
          "🎉 Exclusive offer just for you! Don&apos;t miss out on this amazing deal that&apos;s tailored specifically for our valued members. Limited time only!",
      }));
      setIsGeneratingCopy(false);
    }, 2000);
  };

  const handleSubmit = () => {
    // Handle campaign creation
    console.log("Creating campaign:", formData);
    onClose();
  };

  // Keyboard ESC handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-4xl h-full bg-white rounded-l-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Campaign
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Campaign Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter campaign name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Brief description"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount Configuration */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Discount Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Type
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="free">Free</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Value
                      </label>
                      <input
                        type="text"
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountValue: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={
                          formData.discountType === "percentage" ? "20" : "50"
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Audience & Channels */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Targeting
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Audience
                      </label>
                      <select
                        value={formData.audience}
                        onChange={(e) =>
                          setFormData({ ...formData, audience: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select audience</option>
                        {audienceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} ({option.count} members)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distribution Channels
                      </label>
                      <div className="space-y-2">
                        {channelOptions.map((channel) => (
                          <label
                            key={channel.value}
                            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.channels.includes(
                                channel.value,
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    channels: [
                                      ...formData.channels,
                                      channel.value,
                                    ],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    channels: formData.channels.filter(
                                      (c) => c !== channel.value,
                                    ),
                                  });
                                }
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex items-center space-x-2">
                              {channel.icon}
                              <span className="font-medium">
                                {channel.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 ml-auto">
                              {channel.reach} reach
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Campaign Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Copy Generator */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    AI Copy Generation
                  </h3>
                  <div className="bg-purple-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FiCpu className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-gray-900">
                          AI Copy Suggestion
                        </span>
                      </div>
                      <button
                        onClick={generateAICopy}
                        disabled={isGeneratingCopy}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50"
                      >
                        {isGeneratingCopy ? "Generating..." : "Generate Copy"}
                      </button>
                    </div>
                    {formData.aiCopy && (
                      <div className="bg-white p-4 rounded-xl border border-purple-200">
                        <p className="text-gray-700 mb-3">{formData.aiCopy}</p>
                        <button className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center space-x-1">
                          <FiCopy className="h-4 w-4" />
                          <span>Copy to clipboard</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Automation Toggle */}
                <div>
                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableAutomation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enableAutomation: e.target.checked,
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center space-x-2">
                      <FiZap className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">
                        Enable automation after launch
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <div className="flex items-center space-x-3">
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
                  <FiEye className="h-4 w-4 inline mr-2" />
                  Preview
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  <FiPlay className="h-4 w-4 inline mr-2" />
                  Launch Campaign
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Workflow Modal
interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState<WorkflowType>({
    name: "",
    trigger: "",
    audience: [],
    actions: [],
    isActive: true,
  });

  const triggerOptions = [
    { value: "new-member", label: "New member joins" },
    { value: "inactive-member", label: "Member inactive for 10+ days" },
    { value: "birthday", label: "Member birthday approaching" },
    { value: "milestone", label: "Member reaches milestone" },
    { value: "referral", label: "Member refers friend" },
  ];

  const actionOptions = [
    {
      value: "send-email",
      label: "Send email",
      icon: <FiMail className="h-4 w-4" />,
    },

    {
      value: "send-push",
      label: "Send push notification",
      icon: <FiSmartphone className="h-4 w-4" />,
    },
    {
      value: "apply-discount",
      label: "Apply discount",
      icon: <FiGift className="h-4 w-4" />,
    },
    {
      value: "schedule-followup",
      label: "Schedule follow-up",
      icon: <FiCalendar className="h-4 w-4" />,
    },
  ];

  const handleSubmit = () => {
    console.log("Creating workflow:", formData);
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-4xl h-full bg-white rounded-l-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Create Automation Workflow
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workflow Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter workflow name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger
                    </label>
                    <select
                      value={formData.trigger}
                      onChange={(e) =>
                        setFormData({ ...formData, trigger: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select trigger</option>
                      {triggerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actions
                    </label>
                    <div className="space-y-2">
                      {actionOptions.map((action) => (
                        <label
                          key={action.value}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.actions.includes(action.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  actions: [...formData.actions, action.value],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  actions: formData.actions.filter(
                                    (a) => a !== action.value,
                                  ),
                                });
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex items-center space-x-2">
                            {action.icon}
                            <span className="font-medium">{action.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <FiZap className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">
                          Activate workflow immediately
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* AI Suggestions Panel */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiCpu className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">
                        AI Suggestions
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-xl">
                        <div className="flex items-center space-x-2 mb-1">
                          <FiTrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">
                            High Impact
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Birthday workflows show 45% higher engagement
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl">
                        <div className="flex items-center space-x-2 mb-1">
                          <FiAward className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Best Practice
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Combine email + push for 23% better conversion
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl">
                        <div className="flex items-center space-x-2 mb-1">
                          <FiTarget className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Add follow-up action for inactive triggers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
              >
                <FiCheck className="h-4 w-4 inline mr-2" />
                Create Workflow
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Campaign Preview Modal
interface CampaignPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignType;
}

export const CampaignPreviewModal: React.FC<CampaignPreviewModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  const handleEdit = () => {
    // Handle edit action
    onClose();
  };

  const handleLaunch = () => {
    // Handle launch action
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-4xl h-full bg-white rounded-l-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Campaign Preview
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Summary Details */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <FiGift className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {campaign.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {campaign.discountValue}
                        {campaign.discountType === "percentage" ? "%" : "$"}
                      </div>
                      <div className="text-sm text-gray-600">Discount</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {campaign.channels.length}
                      </div>
                      <div className="text-sm text-gray-600">Channels</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        180
                      </div>
                      <div className="text-sm text-gray-600">
                        Expected Reach
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        4.2x
                      </div>
                      <div className="text-sm text-gray-600">Expected ROI</div>
                    </div>
                  </div>
                </div>

                {/* AI Copy Preview */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    AI Copy Preview
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiCpu className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Generated Copy
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{campaign.aiCopy}</p>
                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center space-x-1">
                      <FiCopy className="h-4 w-4" />
                      <span>Copy to clipboard</span>
                    </button>
                  </div>
                </div>

                {/* Discount Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Discount Details
                  </h3>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Type</span>
                        <div className="font-medium text-gray-900 capitalize">
                          {campaign.discountType}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Value</span>
                        <div className="font-medium text-gray-900">
                          {campaign.discountValue}
                          {campaign.discountType === "percentage" ? "%" : "$"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Start Date
                        </span>
                        <div className="font-medium text-gray-900">
                          {campaign.startDate}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">End Date</span>
                        <div className="font-medium text-gray-900">
                          {campaign.endDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Channels */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Distribution Channels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {campaign.channels.map((channel, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-3"
                      >
                        <div className="flex items-center space-x-2">
                          {channel === "email" && (
                            <FiMail className="h-4 w-4 text-blue-600" />
                          )}

                          {channel === "push" && (
                            <FiSmartphone className="h-4 w-4 text-purple-600" />
                          )}
                          {channel === "in-app" && (
                            <FiTarget className="h-4 w-4 text-orange-600" />
                          )}
                          {channel === "social" && (
                            <FiShare2 className="h-4 w-4 text-pink-600" />
                          )}
                          <span className="font-medium text-gray-900 capitalize">
                            {channel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Targeting */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Target Audience
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiUsers className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-gray-900">
                        {campaign.audience}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      180 members will receive this campaign
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEdit}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  <FiSettings className="h-4 w-4 inline mr-2" />
                  Edit
                </button>
                <button
                  onClick={handleLaunch}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  <FiPlay className="h-4 w-4 inline mr-2" />
                  Launch Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Wrapper Component
interface PromotionsModalsProps {
  campaignBuilderOpen: boolean;
  workflowOpen: boolean;
  previewOpen: boolean;
  onCloseCampaignBuilder: () => void;
  onCloseWorkflow: () => void;
  onClosePreview: () => void;
  campaignData?: CampaignType;
}

export const PromotionsModals: React.FC<PromotionsModalsProps> = ({
  campaignBuilderOpen,
  workflowOpen,
  previewOpen,
  onCloseCampaignBuilder,
  onCloseWorkflow,
  onClosePreview,
  campaignData,
}) => {
  return (
    <>
      <CampaignBuilderModal
        isOpen={campaignBuilderOpen}
        onClose={onCloseCampaignBuilder}
        template={campaignData}
      />
      <WorkflowModal isOpen={workflowOpen} onClose={onCloseWorkflow} />
      <CampaignPreviewModal
        isOpen={previewOpen}
        onClose={onClosePreview}
        campaign={
          campaignData || {
            name: "Sample Campaign",
            description: "This is a sample campaign for preview",
            discountType: "percentage",
            discountValue: "20",
            audience: "Active Members",
            channels: ["email"],
            startDate: "2024-01-01",
            endDate: "2024-01-31",
            aiCopy:
              "🎉 Exclusive offer just for you! Don&apos;t miss out on this amazing deal.",
          }
        }
      />
    </>
  );
};

export default PromotionsModals;
