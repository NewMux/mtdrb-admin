import React, { useState, useEffect } from "react";
import {
  FiGift,
  FiMail,
  FiPhone,
  FiUsers,
  FiCalendar,
  FiTarget,
  FiCpu,
  FiZap,
  FiTrendingUp,
  FiAward,
  FiCopy,
  FiEye,
} from "react-icons/fi";
import { motion } from "framer-motion";
import {
  generateAICopy,
  calculateExpectedROI,
} from "../../api/promotionInsights";

interface PromotionBuilderProps {
  refreshKey: number;
}

interface CampaignForm {
  name: string;
  description: string;
  discountType: "percentage" | "fixed" | "free";
  discountValue: string;
  audience: string;
  channels: string[];
  startDate: string;
  endDate: string;
  minOrder?: string;
  maxUses?: string;
  aiCopy: string;
}

const PromotionBuilder: React.FC<PromotionBuilderProps> = ({ refreshKey }) => {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formData, setFormData] = useState<CampaignForm>({
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    audience: "",
    channels: [],
    startDate: "",
    endDate: "",
    minOrder: "",
    maxUses: "",
    aiCopy: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [expectedROI, setExpectedROI] = useState<number | null>(null);

  const templates = [
    {
      id: "new-member",
      name: "New Member Welcome",
      description: "Welcome offer for new gym members",
      discount: "20% off first month",
      audience: "New members",
      channels: ["Email"],
      goal: "Retention",
      expectedROI: "3.8x",
      reach: "45 members",
    },
    {
      id: "seasonal",
      name: "Seasonal Promotion",
      description: "Holiday and seasonal campaigns",
      discount: "30% off annual membership",
      audience: "All members",
      channels: ["Email", "Social"],
      goal: "Acquisition",
      expectedROI: "4.2x",
      reach: "180 members",
    },
    {
      id: "referral",
      name: "Referral Rewards",
      description: "Member referral incentive program",
      discount: "$50 credit for both",
      audience: "Active members",
      channels: ["Email", "In-App"],
      goal: "Acquisition",
      expectedROI: "5.1x",
      reach: "67 members",
    },
    {
      id: "winback",
      name: "Win-Back Campaign",
      description: "Re-engage inactive members",
      discount: "50% off comeback month",
      audience: "Inactive members",
      channels: ["Email"],
      goal: "Retention",
      expectedROI: "4.5x",
      reach: "89 members",
    },
  ];

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
      icon: <FiZap className="h-4 w-4" />,
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
      icon: <FiUsers className="h-4 w-4" />,
      reach: "40%",
    },
  ];

  const generateAICopy = async () => {
    setIsGeneratingCopy(true);
    try {
      // Determine campaign type based on template or form data
      let campaignType = "general";
      if (selectedTemplate === "referral") campaignType = "referral";
      else if (selectedTemplate === "new-member") campaignType = "welcome";
      else if (selectedTemplate === "winback") campaignType = "winback";
      else if (selectedTemplate === "seasonal") campaignType = "seasonal";

      const copySuggestions = await generateAICopy(
        campaignType,
        formData.audience,
        {
          type: formData.discountType,
          value: parseFloat(formData.discountValue) || 0,
        },
      );

      setFormData((prev) => ({
        ...prev,
        aiCopy:
          copySuggestions[0] ||
          "🎉 Exclusive offer just for you! Don&apos;t miss out on this amazing deal.",
      }));
    } catch (error) {
      console.error("Error generating AI copy:", error);
      setFormData((prev) => ({
        ...prev,
        aiCopy:
          "🎉 Exclusive offer just for you! Don&apos;t miss out on this amazing deal.",
      }));
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const calculateExpectedReach = () => {
    const selectedAudience = audienceOptions.find(
      (a) => a.value === formData.audience,
    );
    const channelReach = formData.channels.reduce((total, channel) => {
      const channelData = channelOptions.find((c) => c.value === channel);
      return total + (channelData ? parseInt(channelData.reach) : 0);
    }, 0);

    return selectedAudience
      ? Math.round(selectedAudience.count * (channelReach / 100))
      : 0;
  };

  // Calculate expected ROI when form data changes
  useEffect(() => {
    const calculateROI = async () => {
      if (formData.audience && formData.channels.length > 0) {
        try {
          const roi = await calculateExpectedROI({
            audience: formData.audience,
            channels: formData.channels,
            discount: {
              type: formData.discountType,
              value: parseFloat(formData.discountValue) || 0,
            },
          });
          setExpectedROI(roi);
        } catch (error) {
          console.error("Error calculating ROI:", error);
          setExpectedROI(null);
        }
      }
    };

    calculateROI();
  }, [
    formData.audience,
    formData.channels,
    formData.discountType,
    formData.discountValue,
  ]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        discountType: template.discount.includes("%") ? "percentage" : "fixed",
        discountValue: template.discount.match(/\d+/)?.[0] || "",
        audience: template.audience.toLowerCase().replace(/\s+/g, "-"),
        channels: template.channels.map((c) => c.toLowerCase()),
        startDate: "",
        endDate: "",
        minOrder: "",
        maxUses: "",
        aiCopy: "",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Smart Campaign Builder
          </h1>
          <p className="text-gray-600 mt-1">
            Create targeted campaigns with smart-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px] flex items-center space-x-2"
          >
            <FiEye className="h-4 w-4" />
            <span>Preview</span>
          </button>
          <button className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Launch Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Campaign Templates
          </h2>
          <div className="space-y-3">
            {templates.map((template) => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTemplateSelect(template.id)}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-purple-600">
                    {template.discount}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.channels.length} channels
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {template.goal}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {template.expectedROI} ROI
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Campaign Builder Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Campaign Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
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
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your campaign"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                          checked={formData.channels.includes(channel.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                channels: [...formData.channels, channel.value],
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
                          <span className="font-medium">{channel.label}</span>
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

            {/* AI Copy Generator */}
            <div className="mt-6 p-4 bg-purple-50 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FiCpu className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    AI Copy Suggestion
                  </h3>
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

            {/* Real-time Preview */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 p-4 bg-gray-50 rounded-2xl"
              >
                <h3 className="font-semibold text-gray-900 mb-3">
                  Campaign Preview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-xl">
                    <div className="text-gray-500">Expected Reach</div>
                    <div className="font-bold text-lg">
                      {calculateExpectedReach()} members
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl">
                    <div className="text-gray-500">Expected ROI</div>
                    <div className="font-bold text-lg">
                      {expectedROI ? `${expectedROI}x` : "Calculating..."}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl">
                    <div className="text-gray-500">Channels</div>
                    <div className="font-bold text-lg">
                      {formData.channels.length}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionBuilder;
export { PromotionBuilder };
