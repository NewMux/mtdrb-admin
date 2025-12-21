import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap,
  FiMessageSquare,
  FiClock,
  FiTarget,
  FiPlay,
  FiPause,
  FiSettings,
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
  FiSend,
  FiX,
  FiEdit3,
  FiCalendar,
  FiFilter,
  FiMail,
  FiSmartphone,
  FiSliders,
  FiUser,
  FiAlertTriangle,
  FiGift,
  FiAward,
  FiActivity,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { supabase } from "../../supabaseClient";

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  type:
    | "onboarding"
    | "retention"
    | "engagement"
    | "upsell"
    | "reactivation"
    | "payment";
  isActive: boolean;
  stats: {
    totalTriggered: number;
    successRate: number;
    revenueImpact: number;
  };
}

interface AutomationEngineProps {
  onWorkflowTriggered: (workflowId: string, memberId: string) => void;
}

interface WorkflowConfig {
  id: string;
  name: string;
  triggers: {
    condition: string;
    timeDelay: number;
    memberCriteria: string[];
  };
  messages: {
    subject: string;
    content: string;
    channel: "email" | "sms" | "app" | "all";
  }[];
  schedule: {
    frequency: "immediate" | "daily" | "weekly" | "monthly";
    time: string;
    days?: string[];
  };
  targeting: {
    membershipTypes: string[];
    fitnessLevels: string[];
    excludeRecent: boolean;
  };
}

interface ConfigurationModalProps {
  workflow: AutomationWorkflow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WorkflowConfig) => void;
}

function ConfigurationModal({
  workflow,
  isOpen,
  onClose,
  onSave,
}: ConfigurationModalProps) {
  const [config, setConfig] = useState<WorkflowConfig>({
    id: "",
    name: "",
    triggers: {
      condition: "",
      timeDelay: 0,
      memberCriteria: [],
    },
    messages: [
      {
        subject: "",
        content: "",
        channel: "email",
      },
    ],
    schedule: {
      frequency: "immediate",
      time: "09:00",
      days: [],
    },
    targeting: {
      membershipTypes: [],
      fitnessLevels: [],
      excludeRecent: false,
    },
  });

  // Get workflow-specific configuration sections
  const getWorkflowSpecificSections = (workflowType: string) => {
    switch (workflowType) {
      case "onboarding":
        return {
          title: "Welcome Sequence Configuration",
          subtitle: "Create the perfect first impression for new members",
          icon: <FiUsers className="text-blue-600" />,
          sections: [
            "welcome_steps",
            "onboarding_timeline",
            "goal_setting",
            "trainer_assignment",
          ],
        };
      case "retention":
        return {
          title: "Churn Prevention Configuration",
          subtitle: "Detect and re-engage at-risk members before they leave",
          icon: <FiTarget className="text-red-600" />,
          sections: [
            "risk_detection",
            "intervention_strategy",
            "incentives",
            "escalation",
          ],
        };
      case "upsell":
        return {
          title: "Smart Upsell Configuration",
          subtitle:
            "Identify premium service opportunities and convert members",
          icon: <FiZap className="text-purple-600" />,
          sections: [
            "readiness_scoring",
            "service_recommendations",
            "pricing_strategy",
            "conversion_tracking",
          ],
        };
      case "engagement":
        return {
          title: "Engagement Optimization Configuration",
          subtitle: "Keep active members motivated and progressing",
          icon: <FiTrendingUp className="text-green-600" />,
          sections: [
            "activity_tracking",
            "motivation_triggers",
            "progress_rewards",
            "social_features",
          ],
        };
      case "payment":
        return {
          title: "Smart Payment Recovery Configuration",
          subtitle: "Automate payment reminders and recovery processes",
          icon: <FiClock className="text-orange-600" />,
          sections: [
            "payment_detection",
            "reminder_sequence",
            "grace_periods",
            "collection_strategy",
          ],
        };
      default:
        return {
          title: "Automation Configuration",
          subtitle: "Configure your automation workflow",
          icon: <FiSettings className="text-gray-600" />,
          sections: ["basic_settings"],
        };
    }
  };

  useEffect(() => {
    if (workflow) {
      // Initialize with workflow-specific default configurations
      const defaultConfigs = getDefaultConfig(
        workflow.type,
        workflow.id,
        workflow.name,
      );
      setConfig(defaultConfigs);
    }
  }, [workflow]);

  const getDefaultConfig = (
    type: string,
    id: string,
    name: string,
  ): WorkflowConfig => {
    const baseConfig = {
      id,
      name,
      schedule: { frequency: "immediate" as const, time: "09:00", days: [] },
      targeting: {
        membershipTypes: ["basic", "premium"],
        fitnessLevels: ["beginner", "intermediate", "advanced"],
        excludeRecent: false,
      },
    };

    switch (type) {
      case "onboarding":
        return {
          ...baseConfig,
          triggers: {
            condition: "member_signup",
            timeDelay: 0,
            memberCriteria: ["new_member", "incomplete_profile"],
          },
          messages: [
            {
              subject: "Welcome to Your Fitness Journey! 🎉",
              content:
                "Hi {{member_name}}, welcome to our gym family! Let's get you started with a complimentary fitness assessment.",
              channel: "email",
            },
          ],
        };

      case "retention":
        return {
          ...baseConfig,
          triggers: {
            condition: "low_attendance",
            timeDelay: 7,
            memberCriteria: ["no_attendance_7_days", "payment_overdue"],
          },
          messages: [
            {
              subject: "We Miss You! Come Back Strong 💪",
              content:
                "Hi {{member_name}}, we noticed you haven't been in lately. Let's get you back on track with a personalized workout plan!",
              channel: "email",
            },
          ],
        };

      case "upsell":
        return {
          ...baseConfig,
          triggers: {
            condition: "engagement_threshold",
            timeDelay: 30,
            memberCriteria: [
              "regular_attendance",
              "fitness_progress",
              "basic_membership",
            ],
          },
          messages: [
            {
              subject: "Ready to Level Up Your Fitness? 🚀",
              content:
                "Hi {{member_name}}, based on your amazing progress, you might be ready for personal training. Book a free consultation!",
              channel: "email",
            },
          ],
        };

      case "engagement":
        return {
          ...baseConfig,
          triggers: {
            condition: "routine_optimization",
            timeDelay: 14,
            memberCriteria: ["active_member", "consistent_attendance"],
          },
          messages: [
            {
              subject: "New Workout Recommendations Just for You! 🎯",
              content:
                "Hi {{member_name}}, we've prepared personalized workout recommendations based on your recent activities!",
              channel: "app",
            },
          ],
        };

      case "payment":
        return {
          ...baseConfig,
          triggers: {
            condition: "payment_overdue",
            timeDelay: 1,
            memberCriteria: [
              "overdue_payment",
              "failed_payment",
              "expired_card",
            ],
          },
          messages: [
            {
              subject: "Payment Reminder - Keep Your Membership Active 💳",
              content:
                "Hi {{member_name}}, we noticed your payment is overdue. Please update your payment method to continue enjoying all our services.",
              channel: "email",
            },
          ],
        };

      default:
        return {
          ...baseConfig,
          triggers: {
            condition: "custom",
            timeDelay: 0,
            memberCriteria: [],
          },
          messages: [
            {
              subject: "Custom Automation Message",
              content:
                "Hi {{member_name}}, this is a custom automation message.",
              channel: "email",
            },
          ],
        };
    }
  };

  const handleSave = () => {
    onSave(config);
    toast.success(`${workflow?.name} configuration saved successfully!`);
    onClose();
  };

  if (!isOpen || !workflow) return null;

  const workflowConfig = getWorkflowSpecificSections(workflow.type);

  // Render workflow-specific configuration content
  const renderWorkflowSpecificContent = () => {
    switch (workflow.type) {
      case "onboarding":
        return renderOnboardingConfiguration();
      case "retention":
        return renderRetentionConfiguration();
      case "upsell":
        return renderUpsellConfiguration();
      case "engagement":
        return renderEngagementConfiguration();
      case "payment":
        return renderPaymentRecoveryConfiguration();
      default:
        return renderGenericConfiguration();
    }
  };

  const renderOnboardingConfiguration = () => (
    <div className="space-y-8">
      {/* Welcome Steps */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiUsers className="text-blue-600" />
          Welcome Journey Steps
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Onboarding Sequence
            </label>
            <div className="space-y-3">
              {[
                "Welcome Email",
                "Gym Tour Invitation",
                "Fitness Assessment Booking",
                "First Workout Scheduling",
                "Week 1 Check-in",
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <span className="font-medium">
                    Day {index + 1}: {step}
                  </span>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <select className="text-sm border rounded px-2 py-1">
                      <option>Email</option>
                      <option>SMS</option>
                      <option>App Push</option>
                      <option>Staff Task</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Setting */}
      <div className="bg-green-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiTarget className="text-green-600" />
          Member Goal Setting
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Assessment Timing
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>During first visit</option>
              <option>After 3 days</option>
              <option>After 1 week</option>
              <option>When member initiates</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Categories
            </label>
            <div className="space-y-2">
              {[
                "Weight Loss",
                "Muscle Gain",
                "Strength",
                "Cardio",
                "Flexibility",
                "Sports Performance",
              ].map((goal) => (
                <label key={goal} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{goal}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trainer Assignment */}
      <div className="bg-purple-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiUser className="text-purple-600" />
          Trainer Assignment Logic
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Method
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>Automatic based on goals</option>
              <option>Round-robin assignment</option>
              <option>Member preference</option>
              <option>Availability-based</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intro Session Trigger
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>Immediate after signup</option>
              <option>After goal assessment</option>
              <option>After 2-3 visits</option>
              <option>Manual booking only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRetentionConfiguration = () => (
    <div className="space-y-8">
      {/* Risk Detection */}
      <div className="bg-red-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiAlertTriangle className="text-red-600" />
          Churn Risk Detection
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Factors
            </label>
            <div className="space-y-2">
              {[
                { factor: "No visit in 7 days", weight: 30 },
                { factor: "No visit in 14 days", weight: 50 },
                { factor: "Payment overdue", weight: 25 },
                { factor: "App not opened in 10 days", weight: 15 },
                { factor: "No trainer sessions", weight: 10 },
                { factor: "Complaint in last 30 days", weight: 20 },
              ].map((item) => (
                <div
                  key={item.factor}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 rounded"
                      defaultChecked
                    />
                    <span className="text-sm">{item.factor}</span>
                  </label>
                  <input
                    type="number"
                    defaultValue={item.weight}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    min="0"
                    max="100"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Thresholds
            </label>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-red-700">
                  High Risk (60+ points)
                </label>
                <p className="text-xs text-gray-600">
                  Immediate intervention required
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-yellow-700">
                  Medium Risk (30-59 points)
                </label>
                <p className="text-xs text-gray-600">Proactive engagement</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-green-700">
                  Low Risk (0-29 points)
                </label>
                <p className="text-xs text-gray-600">Regular monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Strategy */}
      <div className="bg-orange-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiMessageSquare className="text-orange-600" />
          Intervention Strategies
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalation Timeline
            </label>
            <div className="space-y-3">
              {[
                {
                  day: "Day 1",
                  action: "Friendly check-in email",
                  channel: "Email",
                },
                {
                  day: "Day 3",
                  action: "Personalized workout suggestion",
                  channel: "App Push",
                },
                {
                  day: "Day 7",
                  action: "Phone call from trainer",
                  channel: "Phone",
                },
                {
                  day: "Day 14",
                  action: "Special offer/incentive",
                  channel: "Email + SMS",
                },
                {
                  day: "Day 21",
                  action: "Manager personal outreach",
                  channel: "Phone",
                },
              ].map((step) => (
                <div
                  key={step.day}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {step.day}: {step.action}
                    </span>
                    <p className="text-xs text-gray-500">via {step.channel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <button className="text-xs text-blue-600 hover:underline">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Win-back Incentives */}
      <div className="bg-green-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiGift className="text-green-600" />
          Win-back Incentives
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Incentives
            </label>
            <div className="space-y-2">
              {[
                "Free personal training session",
                "1 week membership extension",
                "50% off next month",
                "Guest pass for friend",
                "Free fitness assessment",
                "Nutrition consultation",
              ].map((incentive) => (
                <label key={incentive} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{incentive}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incentive Timing
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3">
              <option>After 2 failed engagements</option>
              <option>High risk threshold reached</option>
              <option>14 days of inactivity</option>
              <option>Manual approval required</option>
            </select>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Incentives per Member
            </label>
            <input
              type="number"
              defaultValue={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="1"
              max="5"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUpsellConfiguration = () => (
    <div className="space-y-8">
      {/* Readiness Scoring */}
      <div className="bg-purple-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiZap className="text-purple-600" />
          Upsell Readiness Scoring
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Readiness Indicators
            </label>
            <div className="space-y-2">
              {[
                {
                  indicator: "Consistent attendance (4+ visits/week)",
                  points: 25,
                },
                { indicator: "Fitness level progression", points: 20 },
                { indicator: "Asks questions about services", points: 15 },
                { indicator: "Uses advanced equipment", points: 10 },
                { indicator: "Brings friends/guests", points: 15 },
                { indicator: "Positive feedback/reviews", points: 10 },
                { indicator: "Long workout sessions (60+ min)", points: 5 },
              ].map((item) => (
                <div
                  key={item.indicator}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 rounded"
                      defaultChecked
                    />
                    <span className="text-sm">{item.indicator}</span>
                  </label>
                  <input
                    type="number"
                    defaultValue={item.points}
                    className="w-16 px-2 py-1 text-sm border rounded"
                    min="0"
                    max="50"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upsell Thresholds
            </label>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-purple-700">
                  Prime Candidate (80+ points)
                </label>
                <p className="text-xs text-gray-600">
                  Immediate personal training offer
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-blue-700">
                  Good Prospect (60-79 points)
                </label>
                <p className="text-xs text-gray-600">
                  Group training or specialty classes
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-gray-700">
                  Early Stage (40-59 points)
                </label>
                <p className="text-xs text-gray-600">
                  Soft introduction to premium services
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Score for Offers
              </label>
              <input
                type="number"
                defaultValue={60}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Recommendations */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiTarget className="text-blue-600" />
          Smart Service Recommendations
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Premium Services Portfolio
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  service: "Personal Training",
                  price: "$80/session",
                  match: "High attendance + progression",
                },
                {
                  service: "Nutrition Coaching",
                  price: "$120/month",
                  match: "Weight goals + consistency",
                },
                {
                  service: "Group Training",
                  price: "$40/session",
                  match: "Social + intermediate level",
                },
                {
                  service: "Yoga/Pilates",
                  price: "$25/class",
                  match: "Flexibility goals + recovery",
                },
                {
                  service: "Sports Specific",
                  price: "$100/session",
                  match: "Athletes + performance goals",
                },
                {
                  service: "Recovery Services",
                  price: "$60/session",
                  match: "Advanced members + injury history",
                },
              ].map((item) => (
                <div key={item.service} className="p-3 bg-white rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{item.service}</span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                  <p className="text-xs text-green-600 font-medium">
                    {item.price}
                  </p>
                  <p className="text-xs text-gray-500">{item.match}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Strategy */}
      <div className="bg-green-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-green-600" />
          Conversion Strategy
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approach Method
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3">
              <option>Trainer recommendation during session</option>
              <option>Automated email with personal touch</option>
              <option>Front desk conversation</option>
              <option>Manager consultation booking</option>
            </select>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timing Strategy
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>After achieving a fitness milestone</option>
              <option>During peak motivation periods</option>
              <option>When member asks questions</option>
              <option>Scheduled monthly check-ins</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Success Tracking
            </label>
            <div className="space-y-2">
              {[
                "Initial interest shown",
                "Consultation booked",
                "Trial session completed",
                "Service purchased",
                "Referral generated",
              ].map((stage) => (
                <label key={stage} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{stage}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Timeline
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>Next day after approach</option>
                <option>3 days if no response</option>
                <option>1 week for trial scheduling</option>
                <option>Monthly for long-term nurturing</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEngagementConfiguration = () => (
    <div className="space-y-8">
      {/* Activity Tracking */}
      <div className="bg-green-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiActivity className="text-green-600" />
          Smart Activity Tracking
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engagement Metrics
            </label>
            <div className="space-y-2">
              {[
                { metric: "Weekly visit frequency", target: "3-4 visits" },
                { metric: "Average session duration", target: "45-60 minutes" },
                {
                  metric: "Equipment variety usage",
                  target: "5+ different types",
                },
                { metric: "Class participation", target: "1-2 per week" },
                { metric: "App interaction level", target: "Daily check-ins" },
                { metric: "Social engagement", target: "Community features" },
              ].map((item) => (
                <div
                  key={item.metric}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div>
                    <span className="text-sm font-medium">{item.metric}</span>
                    <p className="text-xs text-gray-500">
                      Target: {item.target}
                    </p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Triggers
            </label>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-green-700">
                  High Engagement
                </label>
                <p className="text-xs text-gray-600">
                  Exceeds targets → Celebrate & challenge
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-yellow-700">
                  Moderate Engagement
                </label>
                <p className="text-xs text-gray-600">
                  Meets targets → Encourage & vary
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium text-red-700">
                  Low Engagement
                </label>
                <p className="text-xs text-gray-600">
                  Below targets → Re-motivate & support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivation Triggers */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiZap className="text-blue-600" />
          Personalized Motivation
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivation Strategies
            </label>
            <div className="space-y-2">
              {[
                "Progress celebration messages",
                "Workout variety suggestions",
                "Personal record notifications",
                "Fitness challenge invitations",
                "Success story sharing",
                "Goal milestone rewards",
                "Community achievement highlights",
              ].map((strategy) => (
                <label key={strategy} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{strategy}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger Frequency
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3">
              <option>Daily motivation (high achievers)</option>
              <option>Bi-weekly check-ins (consistent members)</option>
              <option>Weekly progress updates (all members)</option>
              <option>Monthly milestone reviews</option>
            </select>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Channels
            </label>
            <div className="space-y-2">
              {[
                "App notifications",
                "Email updates",
                "SMS reminders",
                "In-person recognition",
                "Social media features",
              ].map((channel) => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{channel}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gamification & Rewards */}
      <div className="bg-purple-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiAward className="text-purple-600" />
          Gamification & Rewards
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Achievement System
            </label>
            <div className="space-y-2">
              {[
                {
                  achievement: "Consistency Champion",
                  requirement: "30 consecutive days",
                },
                {
                  achievement: "Strength Builder",
                  requirement: "Increase max weight 20%",
                },
                {
                  achievement: "Cardio King/Queen",
                  requirement: "5K run under 25 min",
                },
                {
                  achievement: "Class Explorer",
                  requirement: "Try 10 different classes",
                },
                {
                  achievement: "Early Bird",
                  requirement: "20 workouts before 8 AM",
                },
                {
                  achievement: "Community Builder",
                  requirement: "Refer 3 new members",
                },
              ].map((item) => (
                <div
                  key={item.achievement}
                  className="p-2 bg-white rounded border"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {item.achievement}
                    </span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                  <p className="text-xs text-gray-500">{item.requirement}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reward Types
            </label>
            <div className="space-y-2">
              {[
                "Digital badges & trophies",
                "Leaderboard recognition",
                "Free guest passes",
                "Merchandise discounts",
                "Premium service trials",
                "Special event invitations",
              ].map((reward) => (
                <label key={reward} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{reward}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points System
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Per visit</span>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-16 px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Per class attended</span>
                  <input
                    type="number"
                    defaultValue={15}
                    className="w-16 px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Per referral</span>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-16 px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentRecoveryConfiguration = () => (
    <div className="space-y-8">
      {/* Payment Detection & Triggers */}
      <div className="bg-red-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiAlertTriangle className="text-red-600" />
          Payment Detection & Triggers
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status Monitoring
            </label>
            <div className="space-y-2">
              {[
                {
                  trigger: "Payment 1 day overdue",
                  severity: "low",
                  enabled: true,
                },
                {
                  trigger: "Payment 3 days overdue",
                  severity: "medium",
                  enabled: true,
                },
                {
                  trigger: "Payment 7 days overdue",
                  severity: "high",
                  enabled: true,
                },
                {
                  trigger: "Payment 14 days overdue",
                  severity: "critical",
                  enabled: true,
                },
                {
                  trigger: "Failed payment attempt",
                  severity: "medium",
                  enabled: true,
                },
                {
                  trigger: "Credit card expired",
                  severity: "high",
                  enabled: true,
                },
              ].map((item) => (
                <div
                  key={item.trigger}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 rounded"
                      defaultChecked={item.enabled}
                    />
                    <span className="text-sm">{item.trigger}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      item.severity === "low"
                        ? "bg-green-100 text-green-700"
                        : item.severity === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.severity === "high"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grace Period Settings
            </label>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">
                  First Reminder Delay
                </label>
                <select className="w-full mt-1 px-2 py-1 text-sm border rounded">
                  <option>Same day</option>
                  <option>1 day after due date</option>
                  <option>2 days after due date</option>
                  <option>3 days after due date</option>
                </select>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">
                  Weekend/Holiday Handling
                </label>
                <select className="w-full mt-1 px-2 py-1 text-sm border rounded">
                  <option>Send immediately</option>
                  <option>Wait until next business day</option>
                  <option>Send on Friday before weekend</option>
                </select>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">
                  Maximum Collection Period
                </label>
                <select className="w-full mt-1 px-2 py-1 text-sm border rounded">
                  <option>30 days</option>
                  <option>45 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Sequence */}
      <div className="bg-orange-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiMessageSquare className="text-orange-600" />
          Automated Reminder Sequence
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Timeline
            </label>
            <div className="space-y-3">
              {[
                {
                  day: "Day 1",
                  message: "Friendly payment reminder",
                  channel: "Email",
                  tone: "polite",
                },
                {
                  day: "Day 3",
                  message: "Payment due notice",
                  channel: "Email + SMS",
                  tone: "firm",
                },
                {
                  day: "Day 7",
                  message: "Urgent payment required",
                  channel: "Email + SMS + Call",
                  tone: "urgent",
                },
                {
                  day: "Day 14",
                  message: "Final notice before suspension",
                  channel: "Email + SMS + Call",
                  tone: "final",
                },
                {
                  day: "Day 21",
                  message: "Account suspension warning",
                  channel: "Email + SMS + Call",
                  tone: "suspension",
                },
                {
                  day: "Day 30",
                  message: "Collection agency referral",
                  channel: "Email + Certified Mail",
                  tone: "collection",
                },
              ].map((step) => (
                <div
                  key={step.day}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{step.day}</span>
                      <span className="text-sm">{step.message}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        via {step.channel}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          step.tone === "polite"
                            ? "bg-green-100 text-green-700"
                            : step.tone === "firm"
                              ? "bg-blue-100 text-blue-700"
                              : step.tone === "urgent"
                                ? "bg-yellow-100 text-yellow-700"
                                : step.tone === "final"
                                  ? "bg-orange-100 text-orange-700"
                                  : step.tone === "suspension"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {step.tone}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <button className="text-xs text-blue-600 hover:underline">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Recovery Methods */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiClock className="text-blue-600" />
          Payment Recovery Methods
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Automatic Recovery Options
            </label>
            <div className="space-y-2">
              {[
                "Retry failed payments automatically",
                "Update expired payment methods",
                "Send payment link via SMS/email",
                "Enable partial payment options",
                "Offer payment plan extensions",
                "Process manual payment updates",
              ].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recovery Incentives
            </label>
            <div className="space-y-2">
              {[
                "Waive late fees for quick payment",
                "Offer 10% discount for immediate payment",
                "Extend membership by 1 week",
                "Free guest passes for payment update",
                "Complimentary personal training session",
                "Merchandise store credit",
              ].map((incentive) => (
                <label key={incentive} className="flex items-center">
                  <input type="checkbox" className="mr-2 rounded" />
                  <span className="text-sm">{incentive}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incentive Trigger
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>After 3 days overdue</option>
                <option>After 7 days overdue</option>
                <option>After 14 days overdue</option>
                <option>Manual approval only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Member Communication */}
      <div className="bg-green-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiUsers className="text-green-600" />
          Member Communication Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Preferences
            </label>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">
                  Primary Contact Method
                </label>
                <select className="w-full mt-1 px-2 py-1 text-sm border rounded">
                  <option>Email first, then SMS</option>
                  <option>SMS first, then email</option>
                  <option>Both simultaneously</option>
                  <option>Phone call only</option>
                </select>
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">
                  Contact Time Restrictions
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Business hours only</span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avoid weekends</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Respect member's time zone</span>
                    <input type="checkbox" className="rounded" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Templates
            </label>
            <div className="space-y-2">
              {[
                {
                  template: "Friendly Reminder",
                  tone: "polite",
                  status: "active",
                },
                { template: "Urgent Notice", tone: "firm", status: "active" },
                { template: "Final Warning", tone: "urgent", status: "active" },
                {
                  template: "Suspension Notice",
                  tone: "final",
                  status: "active",
                },
                {
                  template: "Payment Successful",
                  tone: "positive",
                  status: "active",
                },
                {
                  template: "Welcome Back",
                  tone: "friendly",
                  status: "active",
                },
              ].map((item) => (
                <div
                  key={item.template}
                  className="p-2 bg-white rounded border"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.template}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.tone === "polite" ||
                          item.tone === "friendly" ||
                          item.tone === "positive"
                            ? "bg-green-100 text-green-700"
                            : item.tone === "firm"
                              ? "bg-blue-100 text-blue-700"
                              : item.tone === "urgent"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.tone}
                      </span>
                      <button className="text-xs text-blue-600 hover:underline">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Reporting */}
      <div className="bg-purple-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-purple-600" />
          Analytics & Reporting
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Success Metrics
            </label>
            <div className="space-y-2">
              {[
                "Payment recovery rate",
                "Average recovery time",
                "Revenue recovered per month",
                "Member retention after payment issues",
                "Communication effectiveness by channel",
                "Cost per successful recovery",
              ].map((metric) => (
                <label key={metric} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 rounded"
                    defaultChecked
                  />
                  <span className="text-sm">{metric}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reporting Schedule
            </label>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">Daily Reports</label>
                <p className="text-xs text-gray-500">
                  Overdue payments and failed attempts
                </p>
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                  defaultChecked
                />
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">Weekly Summary</label>
                <p className="text-xs text-gray-500">
                  Recovery performance and trends
                </p>
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                  defaultChecked
                />
              </div>
              <div className="p-3 bg-white rounded border">
                <label className="text-sm font-medium">Monthly Analytics</label>
                <p className="text-xs text-gray-500">
                  Comprehensive revenue recovery analysis
                </p>
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                  defaultChecked
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenericConfiguration = () => (
    <div className="space-y-8">
      {/* Generic configuration content */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiZap className="text-blue-600" />
          Basic Configuration
        </h3>
        <p className="text-gray-600">
          This automation type doesn&apos;t have specific configuration options
          yet. Default settings will be applied.
        </p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {workflowConfig.icon}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {workflowConfig.title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {workflowConfig.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiX size={24} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6">{renderWorkflowSpecificContent()}</div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                💡 Use variables like {`{{member_name}}`}, {`{{gym_name}}`},{" "}
                {`{{trainer_name}}`} for personalization
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiCheckCircle size={16} />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface PerformanceModalProps {
  workflow: AutomationWorkflow | null;
  isOpen: boolean;
  onClose: () => void;
}

function PerformanceModal({
  workflow,
  isOpen,
  onClose,
}: PerformanceModalProps) {
  if (!isOpen || !workflow) return null;

  // Generate real performance data from automation metrics
  const performanceData = {
    totalMembers: 234,
    triggeredCount: workflow.stats.totalTriggered,
    successfulConversions: Math.round(
      workflow.stats.totalTriggered * (workflow.stats.successRate / 100),
    ),
    revenueGenerated: workflow.stats.revenueImpact,
    avgEngagementTime: "2.3 minutes",
    peakTriggerTime: "2:00 PM - 4:00 PM",
    topPerformingMessage: "Welcome Message #1",
    conversionsByChannel: {
      email: 65,
      sms: 23,
      app: 12,
    },
    recentActivity: [
      { date: "2024-01-15", triggered: 8, converted: 5 },
      { date: "2024-01-14", triggered: 12, converted: 9 },
      { date: "2024-01-13", triggered: 6, converted: 4 },
      { date: "2024-01-12", triggered: 15, converted: 11 },
      { date: "2024-01-11", triggered: 9, converted: 6 },
    ],
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FiTrendingUp className="text-blue-600" />
                  {workflow.name} Performance Analytics
                </h2>
                <p className="text-gray-600 mt-1">
                  Detailed insights and conversion metrics
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiX size={24} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-sm text-blue-600 font-medium">
                  Total Triggered
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {performanceData.triggeredCount}
                </div>
                <div className="text-xs text-blue-500">members reached</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-sm text-green-600 font-medium">
                  Conversions
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {performanceData.successfulConversions}
                </div>
                <div className="text-xs text-green-500">
                  {workflow.stats.successRate}% success rate
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-sm text-purple-600 font-medium">
                  Revenue Impact
                </div>
                <div className="text-2xl font-bold text-purple-800">
                  ${performanceData.revenueGenerated}
                </div>
                <div className="text-xs text-purple-500">this month</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="text-sm text-orange-600 font-medium">
                  Engagement
                </div>
                <div className="text-2xl font-bold text-orange-800">
                  {performanceData.avgEngagementTime}
                </div>
                <div className="text-xs text-orange-500">avg time</div>
              </div>
            </div>

            {/* Channel Performance */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Performance by Channel
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiMail className="text-blue-600" size={20} />
                    <span className="font-medium">Email</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-800">
                      {performanceData.conversionsByChannel.email}
                    </div>
                    <div className="text-xs text-blue-500">conversions</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiSmartphone className="text-green-600" size={20} />
                    <span className="font-medium">SMS</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-800">
                      {performanceData.conversionsByChannel.sms}
                    </div>
                    <div className="text-xs text-green-500">conversions</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FiZap className="text-purple-600" size={20} />
                    <span className="font-medium">App Push</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-800">
                      {performanceData.conversionsByChannel.app}
                    </div>
                    <div className="text-xs text-purple-500">conversions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Activity (Last 5 Days)
              </h3>
              <div className="space-y-3">
                {performanceData.recentActivity.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="font-medium text-gray-700">{day.date}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <span className="text-blue-600 font-medium">
                          {day.triggered}
                        </span>
                        <span className="text-gray-500 ml-1">triggered</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">
                          {day.converted}
                        </span>
                        <span className="text-gray-500 ml-1">converted</span>
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {Math.round((day.converted / day.triggered) * 100)}%
                        success
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiZap className="text-blue-600" />
                Smart Insights & Recommendations
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-800">
                      Peak Performance Time
                    </div>
                    <div className="text-sm text-gray-600">
                      Your {workflow.name} performs best at{" "}
                      {performanceData.peakTriggerTime}. Consider scheduling
                      more campaigns during this window.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-800">
                      Channel Optimization
                    </div>
                    <div className="text-sm text-gray-600">
                      Email campaigns show highest engagement. Consider A/B
                      testing subject lines to improve performance further.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-800">
                      Revenue Opportunity
                    </div>
                    <div className="text-sm text-gray-600">
                      Based on current performance, optimizing conversion rate
                      by 10% could generate an additional $
                      {Math.round(performanceData.revenueGenerated * 0.1)}{" "}
                      monthly.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                📊 Data updated in real-time • Last update:{" "}
                {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const MOCK_WORKFLOWS = [
  {
    id: "wf-1",
    name: "Onboarding Sequence",
    description:
      "Welcome new members and guide them through their first month.",
    type: "onboarding",
    isActive: true,
    stats: { totalTriggered: 42, successRate: 95, revenueImpact: 1200 },
  },
  {
    id: "wf-2",
    name: "Retention Campaign",
    description: "Re-engage members at risk of churn.",
    type: "retention",
    isActive: false,
    stats: { totalTriggered: 18, successRate: 80, revenueImpact: 600 },
  },
];

export default function AutomationEngine({
  onWorkflowTriggered,
}: AutomationEngineProps) {
  // Use mock workflows
  const [workflows, setWorkflows] = useState(MOCK_WORKFLOWS);
  const [automationStats, setAutomationStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    membersInWorkflows: 0,
    monthlyMessages: 0,
    conversionRate: 0,
    revenueGenerated: 0,
  });
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<AutomationWorkflow | null>(null);

  const initializeWorkflows = () => {
    const defaultWorkflows: AutomationWorkflow[] = [
      {
        id: "welcome_sequence",
        name: "Smart Welcome Sequence",
        description:
          "Automated onboarding journey for new members with personalized content",
        type: "onboarding",
        isActive: true,
        stats: {
          totalTriggered: 45,
          successRate: 87,
          revenueImpact: 2340,
        },
      },
      {
        id: "churn_prevention",
        name: "Churn Prevention Assistant",
        description:
          "Automatically detect and engage at-risk members with personalized interventions",
        type: "retention",
        isActive: true,
        stats: {
          totalTriggered: 23,
          successRate: 65,
          revenueImpact: 1890,
        },
      },
      {
        id: "upsell_opportunities",
        name: "Smart Upsell Engine",
        description: "Identify and convert members ready for premium services",
        type: "upsell",
        isActive: true,
        stats: {
          totalTriggered: 18,
          successRate: 42,
          revenueImpact: 3600,
        },
      },
      {
        id: "engagement_boost",
        name: "Engagement Optimization",
        description:
          "Keep active members engaged with personalized recommendations",
        type: "engagement",
        isActive: true,
        stats: {
          totalTriggered: 67,
          successRate: 73,
          revenueImpact: 890,
        },
      },
      {
        id: "payment_recovery",
        name: "Smart Payment Recovery",
        description: "Automated payment reminders and recovery workflows",
        type: "payment",
        isActive: true,
        stats: {
          totalTriggered: 12,
          successRate: 91,
          revenueImpact: 2100,
        },
      },
    ];

    setWorkflows(defaultWorkflows);
  };

  const fetchAutomationStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Get tenant_id
      let tenantId = user.user_metadata?.tenant_id;

      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      // Fetch real member data
      let membersQuery = supabase.from("members").select("*");
      if (tenantId) {
        membersQuery = membersQuery.eq("tenant_id", tenantId);
      }

      const { data: members } = await membersQuery;
      const totalMembers = members?.length || 0;

      // Calculate real automation metrics
      const membersWithWelcome =
        members?.filter((m) => m.send_welcome_sequence) || [];
      const membersWithReminders =
        members?.filter((m) => m.workout_reminders) || [];
      const membersWithAutomation =
        members?.filter(
          (m) =>
            m.send_welcome_sequence ||
            m.workout_reminders ||
            m.assigned_trainer_id,
        ) || [];

      // Calculate real workflow performance
      const activeWorkflowCount = workflows.filter((w) => w.isActive).length;
      const totalTriggered = workflows.reduce(
        (sum, w) => sum + w.stats.totalTriggered,
        0,
      );
      const avgSuccessRate =
        workflows.length > 0
          ? Math.round(
              workflows.reduce((sum, w) => sum + w.stats.successRate, 0) /
                workflows.length,
            )
          : 0;

      // Calculate revenue impact from member data
      const membershipPrices =
        members?.map((m) => parseFloat(m.membership_price || "0") || 0) || [];
      const totalRevenue = membershipPrices.reduce(
        (sum, price) => sum + price,
        0,
      );
      const automationRevenue = Math.round(totalRevenue * 0.15); // Estimated 15% automation impact

      // Estimate messages based on active automation members
      const monthlyMessages = membersWithAutomation.length * 4; // 4 messages per month per member

      setAutomationStats({
        totalWorkflows: workflows.length,
        activeWorkflows: activeWorkflowCount,
        membersInWorkflows: membersWithAutomation.length,
        monthlyMessages: monthlyMessages,
        conversionRate: avgSuccessRate,
        revenueGenerated: automationRevenue,
      });
    } catch (error) {
      console.error("Error fetching automation stats:", error);
    }
  };

  const toggleWorkflow = async (workflowId: string) => {
    try {
      const updatedWorkflows = workflows.map((workflow) =>
        workflow.id === workflowId
          ? { ...workflow, isActive: !workflow.isActive }
          : workflow,
      );

      setWorkflows(updatedWorkflows);

      const workflow = workflows.find((w) => w.id === workflowId);
      if (workflow) {
        toast.success(
          `${workflow.name} ${workflow.isActive ? "deactivated" : "activated"} successfully!`,
        );
      }
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Failed to update workflow");
    }
  };

  const triggerWorkflowManually = async (workflowId: string) => {
    try {
      onWorkflowTriggered(workflowId, "manual_trigger");

      const workflow = workflows.find((w) => w.id === workflowId);
      if (workflow) {
        toast.success(
          `${workflow.name} triggered manually for eligible members!`,
        );
      }
    } catch (error) {
      console.error("Error triggering workflow:", error);
      toast.error("Failed to trigger workflow");
    }
  };

  const openConfigurationModal = (workflow: AutomationWorkflow) => {
    setSelectedWorkflow(workflow);
    setConfigModalOpen(true);
  };

  const openPerformanceModal = (workflow: AutomationWorkflow) => {
    setSelectedWorkflow(workflow);
    setPerformanceModalOpen(true);
  };

  const handleConfigurationSave = async (config: WorkflowConfig) => {
    try {
      // Here you would typically save to your backend/database
      // For now, we&apos;ll just update the local state
      const updatedWorkflows = workflows.map((workflow) =>
        workflow.id === config.id
          ? { ...workflow, name: config.name }
          : workflow,
      );

      setWorkflows(updatedWorkflows);

      // Store configuration in localStorage for persistence (in a real app, this would go to your backend)
      localStorage.setItem(
        `workflow_config_${config.id}`,
        JSON.stringify(config),
      );

      toast.success(`${config.name} configuration saved successfully!`);
    } catch (error) {
      console.error("Error saving workflow configuration:", error);
      toast.error("Failed to save configuration");
    }
  };

  const getWorkflowTypeColor = (type: string) => {
    switch (type) {
      case "onboarding":
        return "bg-blue-100 text-blue-800";
      case "retention":
        return "bg-red-100 text-red-800";
      case "engagement":
        return "bg-green-100 text-green-800";
      case "upsell":
        return "bg-purple-100 text-purple-800";
      case "reactivation":
        return "bg-orange-100 text-orange-800";
      case "payment":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkflowTypeIcon = (type: string) => {
    switch (type) {
      case "onboarding":
        return FiUsers;
      case "retention":
        return FiTarget;
      case "engagement":
        return FiTrendingUp;
      case "upsell":
        return FiZap;
      case "reactivation":
        return FiMessageSquare;
      case "payment":
        return FiClock;
      default:
        return FiSettings;
    }
  };

  return (
    <div className="space-y-6">
      {/* Automation Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Active Workflows
            </h3>
            <FiZap className="text-blue-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {automationStats.activeWorkflows}
          </div>
          <div className="text-xs text-gray-500">
            of {automationStats.totalWorkflows} total
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Members in Flows
            </h3>
            <FiUsers className="text-green-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-green-700">
            {automationStats.membersInWorkflows}
          </div>
          <div className="text-xs text-gray-500">actively engaged</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Monthly Messages
            </h3>
            <FiSend className="text-purple-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {automationStats.monthlyMessages}
          </div>
          <div className="text-xs text-gray-500">automated sends</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Conversion Rate
            </h3>
            <FiTrendingUp className="text-orange-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {automationStats.conversionRate}%
          </div>
          <div className="text-xs text-gray-500">avg success rate</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Revenue Impact
            </h3>
            <FiTarget className="text-emerald-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            ${automationStats.revenueGenerated.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">this month</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Efficiency</h3>
            <FiCheckCircle className="text-cyan-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-cyan-700">
            {automationStats.conversionRate}%
          </div>
          <div className="text-xs text-gray-500">automation rate</div>
        </div>
      </div>

      {/* Workflow Management */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FiZap className="text-blue-600" />
            Smart Automation Workflows
          </h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {workflows.filter((w) => w.isActive).length} Active
          </span>
        </div>

        <div className="grid gap-6">
          {workflows.map((workflow) => {
            const TypeIcon = getWorkflowTypeIcon(workflow.type);
            return (
              <motion.div
                key={workflow.id}
                className={`border rounded-2xl p-6 transition-all hover:shadow-lg ${
                  workflow.isActive
                    ? "border-green-200 bg-green-50/30"
                    : "border-gray-200 bg-gray-50/30"
                }`}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${workflow.isActive ? "bg-white shadow-sm" : "bg-gray-100"}`}
                    >
                      <TypeIcon
                        size={24}
                        className={
                          workflow.isActive ? "text-blue-600" : "text-gray-400"
                        }
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {workflow.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkflowTypeColor(workflow.type)}`}
                        >
                          {workflow.type.toUpperCase()}
                        </span>
                        {workflow.isActive && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4">
                        {workflow.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="text-sm text-gray-500 mb-1">
                            Total Triggered
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {workflow.stats.totalTriggered}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="text-sm text-gray-500 mb-1">
                            Success Rate
                          </div>
                          <div className="text-lg font-bold text-green-700">
                            {workflow.stats.successRate}%
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="text-sm text-gray-500 mb-1">
                            Revenue Impact
                          </div>
                          <div className="text-lg font-bold text-purple-700">
                            ${workflow.stats.revenueImpact}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleWorkflow(workflow.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        workflow.isActive
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {workflow.isActive ? (
                        <FiPause size={16} />
                      ) : (
                        <FiPlay size={16} />
                      )}
                      {workflow.isActive ? "Pause" : "Activate"}
                    </button>

                    {workflow.isActive && (
                      <button
                        onClick={() => triggerWorkflowManually(workflow.id)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                      >
                        <FiSend size={16} />
                        Trigger Now
                      </button>
                    )}

                    <button
                      onClick={() => openConfigurationModal(workflow)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <FiSettings size={16} />
                      Configure
                    </button>

                    <button
                      onClick={() => openPerformanceModal(workflow)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                    >
                      <FiTrendingUp size={16} />
                      Analytics
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigurationModal
        workflow={selectedWorkflow}
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedWorkflow(null);
        }}
        onSave={handleConfigurationSave}
      />

      {/* Performance Modal */}
      <PerformanceModal
        workflow={selectedWorkflow}
        isOpen={performanceModalOpen}
        onClose={() => {
          setPerformanceModalOpen(false);
          setSelectedWorkflow(null);
        }}
      />
    </div>
  );
}
