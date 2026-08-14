import React, { useState } from "react";
import {
  ProfileSummaryCard,
  EngagementCard,
  BillingCard,
  GoalsProgressCard,
  RiskAlertsCard,
  MemberProfileCards,
  ProfileCardSkeleton,
  EngagementCardSkeleton,
} from "./MemberProfileCards";

// Sample data for demonstration
const sampleMember = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phone: "+1 (555) 123-4567",
  profile_picture_url: undefined, // Will show placeholder
  membership_status: "active" as const,
  membership_plan: "Premium Fitness Plan",
  membership_expiry: "2024-12-31",
  created_at: "2023-01-15",
};

const sampleEngagementData = {
  score: 85,
  checkins_per_week: 4.2,
  is_high_performer: true,
  at_risk_count: 0,
};

const sampleBillingData = {
  lifetime_value: 2847.5,
  last_payment_date: "2024-01-15",
  last_payment_status: "paid" as const,
  total_invoices: 12,
};

const sampleGoalData = {
  primary_goal: "Lose 10kg and build strength",
  progress_percentage: 65,
  next_milestone: "Reach 70kg target weight",
  goal_type: "weight_loss" as const,
};

const sampleRiskData = {
  churn_risk_score: 15,
  churn_risk_level: "low" as const,
  active_alerts: [
    {
      id: "1",
      type: "low_attendance" as const,
      message: "Missed 2 sessions this week",
      severity: "medium" as const,
    },
  ],
};

// Alternative sample data for different scenarios
const alternativeMember = {
  ...sampleMember,
  name: "Michael Chen",
  membership_status: "trial" as const,
  membership_plan: "Trial Plan",
  membership_expiry: "2024-02-15",
};

const highRiskData = {
  churn_risk_score: 78,
  churn_risk_level: "high" as const,
  active_alerts: [
    {
      id: "1",
      type: "missed_payment" as const,
      message: "Payment failed - 3 attempts",
      severity: "high" as const,
    },
    {
      id: "2",
      type: "low_attendance" as const,
      message: "No check-ins for 2 weeks",
      severity: "high" as const,
    },
    {
      id: "3",
      type: "expired_document" as const,
      message: "Medical certificate expired",
      severity: "medium" as const,
    },
  ],
};

const lowEngagementData = {
  score: 35,
  checkins_per_week: 1.5,
  is_high_performer: false,
  at_risk_count: 2,
};

export const MemberProfileCardsDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<
    "normal" | "trial" | "high-risk"
  >("normal");

  const handleViewInvoices = () => {
    alert("View invoices functionality would open invoice list");
  };

  const handleSendMessage = () => {
    alert(
      "Send re-engagement message functionality would open messaging interface",
    );
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const getCurrentData = () => {
    switch (currentScenario) {
      case "trial":
        return {
          member: alternativeMember,
          engagementData: lowEngagementData,
          billingData: {
            ...sampleBillingData,
            lifetime_value: 0,
            total_invoices: 0,
          },
          goalData: { ...sampleGoalData, progress_percentage: 25 },
          riskData: {
            ...sampleRiskData,
            churn_risk_score: 45,
            churn_risk_level: "medium" as const,
          },
        };
      case "high-risk":
        return {
          member: { ...sampleMember, membership_status: "suspended" as const },
          engagementData: lowEngagementData,
          billingData: {
            ...sampleBillingData,
            last_payment_status: "failed" as const,
          },
          goalData: { ...sampleGoalData, progress_percentage: 15 },
          riskData: highRiskData,
        };
      default:
        return {
          member: sampleMember,
          engagementData: sampleEngagementData,
          billingData: sampleBillingData,
          goalData: sampleGoalData,
          riskData: sampleRiskData,
        };
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Member Profile Cards Demo
              </h1>
              <p className="text-sm text-gray-600">
                MTDRB Fit - Responsive Member Profile UI Components
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={currentScenario}
                onChange={(e) =>
                  setCurrentScenario(
                    e.target.value as "normal" | "trial" | "high-risk",
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal Member</option>
                <option value="trial">Trial Member</option>
                <option value="high-risk">High Risk Member</option>
              </select>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="py-8">
        {/* Individual Cards Demo */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Individual Cards
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ProfileSummaryCard member={currentData.member} />
            <EngagementCard data={currentData.engagementData} />
            <BillingCard
              data={currentData.billingData}
              onViewInvoices={handleViewInvoices}
            />
            <GoalsProgressCard data={currentData.goalData} />
            <RiskAlertsCard
              data={currentData.riskData}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>

        {/* Loading States Demo */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Loading States
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfileCardSkeleton />
            <EngagementCardSkeleton />
            <ProfileCardSkeleton />
            <EngagementCardSkeleton />
          </div>
        </div>

        {/* Complete Layout Demo */}
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Complete Layout
          </h2>
          <MemberProfileCards
            member={currentData.member}
            engagementData={currentData.engagementData}
            billingData={currentData.billingData}
            goalData={currentData.goalData}
            riskData={currentData.riskData}
            isLoading={isLoading}
            onViewInvoices={handleViewInvoices}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Usage Instructions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Individual Components
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  •{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    ProfileSummaryCard
                  </code>{" "}
                  - Member basic info and status
                </p>
                <p>
                  •{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    EngagementCard
                  </code>{" "}
                  - Engagement metrics with circular progress
                </p>
                <p>
                  •{" "}
                  <code className="bg-gray-100 px-1 rounded">BillingCard</code>{" "}
                  - Financial summary with action buttons
                </p>
                <p>
                  •{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    GoalsProgressCard
                  </code>{" "}
                  - Fitness goals with progress tracking
                </p>
                <p>
                  •{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    RiskAlertsCard
                  </code>{" "}
                  - Risk assessment and alerts
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Features
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Responsive design with 2-column grid on desktop</p>
                <p>• Hover effects and smooth transitions</p>
                <p>• Loading skeleton states</p>
                <p>• Accessibility features (ARIA labels, semantic HTML)</p>
                <p>• TypeScript interfaces for type safety</p>
                <p>• MTDRB color palette integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileCardsDemo;
