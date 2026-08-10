import React, { useState } from "react";
import {
  FiUser,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiFileText,
  FiTarget,
  FiDollarSign,
  FiBarChart,
  FiActivity,
  FiSend,
  FiDownload,
  FiPrinter,
  FiShare2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { SmartModal } from "../ui/SmartModal";
import { SmartButton } from "../ui/DesignSystem";
import {
  StatusBadge,
  TagPill,
  TrendSparkline,
  DocumentChecklist,
  WhatsAppButton,
} from "./SmartMemberTable";
import type { SmartMember } from "./SmartMemberTable";
import toast from "react-hot-toast";

type Member = SmartMember & {
  membershipType?: string;
  billingCycle?: string;
  autoRenewal?: boolean;
  paymentMethod?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  staffNotes?: string;
};

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onEdit: (member: Member) => void;
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "attendance" | "billing" | "documents"
  >("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "attendance", label: "Attendance", icon: FiActivity },
    { id: "billing", label: "Billing", icon: FiDollarSign },
    { id: "documents", label: "Documents", icon: FiFileText },
  ];

  const getDaysLeft = (planEnd: string) => {
    const now = new Date();
    const end = new Date(planEnd);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatus = (member: Member) => {
    const now = new Date();
    const planEnd = new Date(member.planEnd);
    const lastCheckIn = new Date(member.lastCheckIn);
    const daysSinceCheckIn =
      (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24);

    if (now > planEnd) return "expired";
    if (daysSinceCheckIn > 10) return "inactive";
    if (member.status === "suspended") return "suspended";
    return "active";
  };

  const isInactive = (member: Member) => {
    const now = new Date();
    const lastCheckIn = new Date(member.lastCheckIn);
    const daysSinceCheckIn =
      (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCheckIn > 10;
  };

  const generateTags = (member: Member) => {
    const tags: string[] = [];

    if (member.isTrial) tags.push("Trial");
    if (member.checkInCount > 15) tags.push("High Performer");
    if (isInactive(member)) tags.push("At Risk");
    if (member.checkInCount > 30) tags.push("Loyal");

    const joinDate = new Date(member.joinDate);
    const now = new Date();
    const daysSinceJoin =
      (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoin <= 30) tags.push("New");

    return tags;
  };

  const getAttendanceStats = (attendance: string[]) => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = attendance.filter(
      (date) => new Date(date) >= lastWeek,
    ).length;
    const thisMonth = attendance.filter(
      (date) => new Date(date) >= lastMonth,
    ).length;

    return { thisWeek, thisMonth, total: attendance.length };
  };

  const getBillingInfo = (member: Member) => {
    const daysLeft = getDaysLeft(member.planEnd);
    const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
    const isExpired = daysLeft <= 0;

    return { daysLeft, isExpiringSoon, isExpired };
  };

  if (!member) return null;

  const computedStatus = getStatus(member);
  const computedTags = generateTags(member);
  const daysLeft = getDaysLeft(member.planEnd);
  const isInactiveMember = isInactive(member);
  const attendanceStats = getAttendanceStats(member.attendance);
  const billingInfo = getBillingInfo(member);

  const renderProfileTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Basic Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Full Name
            </label>
            <p className="text-gray-900">{member.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Age & Gender
            </label>
            <p className="text-gray-900">
              {member.age} years • {member.gender}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-gray-900">{member.phone}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{member.email || "Not provided"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Join Date
            </label>
            <p className="text-gray-900">
              {new Date(member.joinDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Emergency Contact
            </label>
            <p className="text-gray-900">
              {member.emergencyContact || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Status & Tags */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Status & Classification
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <StatusBadge status={computedStatus} daysLeft={daysLeft} />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 block mb-2">
              Tags:
            </span>
            <div className="flex flex-wrap gap-2">
              {computedTags.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <SmartButton
            variant="primary"
            size="sm"
            onClick={() => onEdit(member)}
          >
            <FiEdit className="w-4 h-4 mr-2" />
            Edit Profile
          </SmartButton>

          <WhatsAppButton member={member} template="custom" />

          <SmartButton
            variant="secondary"
            size="sm"
            onClick={() => {
              toast.success("Member profile exported successfully");
            }}
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Export Profile
          </SmartButton>
        </div>
      </div>
    </motion.div>
  );

  const renderAttendanceTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiActivity className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">This Week</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {attendanceStats.thisWeek}
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiBarChart className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              This Month
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {attendanceStats.thisMonth}
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FiTarget className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Total Visits
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {attendanceStats.total}
          </p>
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance Trend
        </h3>
        <TrendSparkline data={member.attendance} memberId={member.id} />

        {isInactiveMember && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <FiAlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Member hasn&apos;t checked in for more than 10 days
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {member.attendance
            .slice(-5)
            .reverse()
            .map((date, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Check-in</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(date).toLocaleDateString()}
                </span>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );

  const renderBillingTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Billing Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Membership Type
            </label>
            <p className="text-gray-900">{member.membershipType || "Basic"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Monthly Fee
            </label>
            <p className="text-gray-900">${member.membershipPrice}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Billing Cycle
            </label>
            <p className="text-gray-900">{member.billingCycle || "Monthly"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Payment Method
            </label>
            <p className="text-gray-900">
              {member.paymentMethod || "Not specified"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Auto Renewal
            </label>
            <p className="text-gray-900">
              {member.autoRenewal ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Plan End Date
            </label>
            <p className="text-gray-900">
              {new Date(member.planEnd).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Billing Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Days Remaining
            </span>
            <span
              className={`text-lg font-bold ${
                billingInfo.isExpired
                  ? "text-red-600"
                  : billingInfo.isExpiringSoon
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              {billingInfo.daysLeft} days
            </span>
          </div>

          {billingInfo.isExpired && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <FiXCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Membership has expired
                </span>
              </div>
            </div>
          )}

          {billingInfo.isExpiringSoon && !billingInfo.isExpired && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Membership expiring soon
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <SmartButton
            variant="primary"
            size="sm"
            onClick={() => {
              toast.success("Invoice generated successfully");
            }}
          >
            <FiPrinter className="w-4 h-4 mr-2" />
            Generate Invoice
          </SmartButton>

          <SmartButton
            variant="secondary"
            size="sm"
            onClick={() => {
              toast.success("Payment reminder sent");
            }}
          >
            <FiSend className="w-4 h-4 mr-2" />
            Send Reminder
          </SmartButton>

          <SmartButton
            variant="secondary"
            size="sm"
            onClick={() => {
              toast.success("Billing history exported");
            }}
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Export History
          </SmartButton>
        </div>
      </div>
    </motion.div>
  );

  const renderDocumentsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Document Status */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Document Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Waiver Form
            </span>
            <div className="flex items-center space-x-2">
              {member.formsSubmitted.includes("waiver") ? (
                <FiCheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <FiXCircle className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`text-sm ${member.formsSubmitted.includes("waiver") ? "text-green-600" : "text-red-600"}`}
              >
                {member.formsSubmitted.includes("waiver")
                  ? "Completed"
                  : "Missing"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              ID Document
            </span>
            <div className="flex items-center space-x-2">
              {member.formsSubmitted.includes("id_document") ? (
                <FiCheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <FiXCircle className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`text-sm ${member.formsSubmitted.includes("id_document") ? "text-green-600" : "text-red-600"}`}
              >
                {member.formsSubmitted.includes("id_document")
                  ? "Completed"
                  : "Missing"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Emergency Contact
            </span>
            <div className="flex items-center space-x-2">
              {member.formsSubmitted.includes("emergency_contact") ? (
                <FiCheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <FiXCircle className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`text-sm ${member.formsSubmitted.includes("emergency_contact") ? "text-green-600" : "text-red-600"}`}
              >
                {member.formsSubmitted.includes("emergency_contact")
                  ? "Completed"
                  : "Missing"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Document Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <SmartButton
            variant="primary"
            size="sm"
            onClick={() => {
              toast.success("Document reminder sent");
            }}
          >
            <FiSend className="w-4 h-4 mr-2" />
            Send Reminder
          </SmartButton>

          <SmartButton
            variant="secondary"
            size="sm"
            onClick={() => {
              toast.success("Documents exported successfully");
            }}
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Export Documents
          </SmartButton>

          <SmartButton
            variant="secondary"
            size="sm"
            onClick={() => {
              toast.success("Document template shared");
            }}
          >
            <FiShare2 className="w-4 h-4 mr-2" />
            Share Templates
          </SmartButton>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Document Checklist
        </h3>
        <DocumentChecklist
          formsSubmitted={member.formsSubmitted}
          memberId={member.id}
        />
      </div>
    </motion.div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "attendance":
        return renderAttendanceTab();
      case "billing":
        return renderBillingTab();
      case "documents":
        return renderDocumentsTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.name}'s Profile`}
      subtitle="Comprehensive member information and management"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusBadge status={computedStatus} daysLeft={daysLeft} />
            {isInactiveMember && (
              <span className="text-sm text-red-600">⚠️ Inactive</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <SmartButton variant="secondary" onClick={onClose}>
              Close
            </SmartButton>

            <SmartButton variant="primary" onClick={() => onEdit(member)}>
              <FiEdit className="w-4 h-4 mr-2" />
              Edit Member
            </SmartButton>
          </div>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">{renderCurrentTab()}</AnimatePresence>
    </SmartModal>
  );
};

export default MemberDetailModal;
