import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSettings, FiUser, FiRotateCw } from "react-icons/fi";
import { MemberProfileCards } from "./MemberProfileCards";

// Types for member data
interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profile_picture_url?: string;
  membership_status: "active" | "trial" | "suspended" | "cancelled" | "expired";
  membership_plan?: string;
  membership_expiry?: string;
  created_at: string;
}

interface EngagementData {
  score: number;
  checkins_per_week: number;
  is_high_performer: boolean;
  at_risk_count: number;
}

interface BillingData {
  lifetime_value: number;
  last_payment_date?: string;
  last_payment_status: "paid" | "pending" | "failed";
  total_invoices: number;
}

interface GoalData {
  primary_goal: string;
  progress_percentage: number;
  next_milestone: string;
  goal_type: "weight_loss" | "muscle_gain" | "endurance" | "strength";
}

interface RiskData {
  churn_risk_score: number;
  churn_risk_level: "low" | "medium" | "high";
  active_alerts: Array<{
    id: string;
    type: "missed_payment" | "low_attendance" | "expired_document";
    message: string;
    severity: "low" | "medium" | "high";
  }>;
}

interface MemberProfileDrawerProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (member: Member) => void;
  onRefresh?: () => void;
}

export default function MemberProfileDrawer({
  member,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}: MemberProfileDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [engagementData, setEngagementData] = useState<EngagementData>({
    score: 85,
    checkins_per_week: 4.2,
    is_high_performer: true,
    at_risk_count: 0,
  });
  const [billingData, setBillingData] = useState<BillingData>({
    lifetime_value: 2847.5,
    last_payment_date: "2024-01-15",
    last_payment_status: "paid",
    total_invoices: 12,
  });
  const [goalData, setGoalData] = useState<GoalData>({
    primary_goal: "Lose 10kg and build strength",
    progress_percentage: 65,
    next_milestone: "Reach 70kg target weight",
    goal_type: "weight_loss",
  });
  const [riskData, setRiskData] = useState<RiskData>({
    churn_risk_score: 15,
    churn_risk_level: "low",
    active_alerts: [
      {
        id: "1",
        type: "low_attendance",
        message: "Missed 2 sessions this week",
        severity: "medium",
      },
    ],
  });

  useEffect(() => {
    if (isOpen && member) {
      setIsLoading(true);
      setTimeout(() => {
        // Update data based on member status
        if (member.membership_status === "active") {
          setEngagementData({
            score: 85,
            checkins_per_week: 4.2,
            is_high_performer: true,
            at_risk_count: 0,
          });
        } else if (member.membership_status === "trial") {
          setEngagementData({
            score: 45,
            checkins_per_week: 1.5,
            is_high_performer: false,
            at_risk_count: 2,
          });
        } else {
          setEngagementData({
            score: 25,
            checkins_per_week: 0.8,
            is_high_performer: false,
            at_risk_count: 3,
          });
        }
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, member]);

  const handleViewInvoices = () => {
    // TODO: Implement view invoices functionality
  };

  const handleSendMessage = () => {
    // TODO: Implement send message functionality
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (!member || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl rounded-l-3xl flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-profile-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 px-6 py-6 rounded-tl-3xl flex-shrink-0">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-all duration-200 p-2 rounded-full hover:bg-white/10 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close member profile"
                title="Close profile"
              >
                <FiX className="w-5 h-5" />
              </button>
              <h1
                id="member-profile-title"
                className="text-white text-xl font-semibold"
              >
                Member Profile
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-white hover:text-blue-100 transition-all duration-200 p-2 rounded-full hover:bg-white/10 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                  aria-label="Refresh member data"
                  title="Refresh"
                >
                  <FiRotateCw
                    className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  className="text-white hover:text-blue-100 transition-all duration-200 p-2 rounded-full hover:bg-white/10 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Member profile settings"
                  title="Settings"
                >
                  <FiSettings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Information */}
            <div className="text-center">
              {/* Profile Picture */}
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-4 flex items-center justify-center shadow-lg ring-4 ring-white/20">
                {member.profile_picture_url ? (
                  <img
                    src={member.profile_picture_url}
                    alt={`Profile picture of ${member.name}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-inner"
                  />
                ) : (
                  <FiUser className="w-10 h-10 text-white/80" />
                )}
              </div>

              {/* Name and Status */}
              <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-sm">
                {member.name || "Member Name"}
              </h2>

              <div className="mb-6">
                <p className="text-blue-100 text-sm font-medium mb-2">
                  {member.membership_status === "active"
                    ? "Active Member"
                    : member.membership_status === "trial"
                      ? "Trial Member"
                      : member.membership_status === "suspended"
                        ? "Suspended Member"
                        : member.membership_status === "cancelled"
                          ? "Cancelled Member"
                          : member.membership_status === "expired"
                            ? "Expired Member"
                            : "Member"}
                </p>
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      member.membership_status === "active"
                        ? "bg-emerald-400"
                        : member.membership_status === "trial"
                          ? "bg-amber-400"
                          : member.membership_status === "suspended"
                            ? "bg-orange-400"
                            : "bg-red-400"
                    }`}
                  ></div>
                  {member.membership_status || "Unknown"}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex justify-center items-center space-x-8">
                <div className="text-center">
                  <div className="text-white font-bold text-xl drop-shadow-sm">
                    {Math.round(engagementData.checkins_per_week * 4)}
                  </div>
                  <div className="text-blue-100 text-xs font-medium">
                    Check-ins
                  </div>
                </div>
                <div className="w-px h-8 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl drop-shadow-sm">
                    {billingData.total_invoices}
                  </div>
                  <div className="text-blue-100 text-xs font-medium">Plans</div>
                </div>
                <div className="w-px h-8 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl drop-shadow-sm">
                    {engagementData.score}%
                  </div>
                  <div className="text-blue-100 text-xs font-medium">
                    Attendance
                  </div>
                </div>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full translate-x-12 translate-y-12"></div>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-t-3xl -mt-4 relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Cards Content */}
            <div className="flex-1 overflow-y-auto">
              <MemberProfileCards
                member={member}
                engagementData={engagementData}
                billingData={billingData}
                goalData={goalData}
                riskData={riskData}
                isLoading={isLoading}
                onViewInvoices={handleViewInvoices}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
