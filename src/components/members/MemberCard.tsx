import React from "react";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiEye,
  FiTrash2,
  FiMessageCircle,
  FiFileText,
  FiTarget,
  FiSend,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { SmartButton } from "../ui/DesignSystem";
import {
  StatusBadge,
  TagPill,
  TrendSparkline,
  DocumentChecklist,
  WhatsAppButton,
} from "./SmartMemberTable";

interface Member {
  id: string;
  name: string;
  email?: string;
  phone: string;
  age: number;
  gender: string;
  joinDate: string;
  planEnd: string;
  lastCheckIn: string;
  checkInCount: number;
  status: "active" | "expired" | "payment_issue" | "inactive";
  membershipPrice: number;
  formsSubmitted: string[];
  isTrial: boolean;
  attendance: string[];
  tags: string[];
  assignedTrainerId?: string;
  fitnessGoal?: string;
  computedStatus?: string;
  computedTags?: string[];
  daysLeft?: number;
  isInactive?: boolean;
  hasCompletedDocs?: boolean;
}

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onView: (member: Member) => void;
  onAssignTrainer: (member: Member) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  onView,
  onAssignTrainer,
}) => {
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
    if (member.status === "payment_issue") return "payment_issue";
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

  const hasCompletedDocs = (member: Member) => {
    return (
      member.formsSubmitted.includes("waiver") &&
      member.formsSubmitted.includes("id_document")
    );
  };

  const computedStatus = getStatus(member);
  const computedTags = generateTags(member);
  const daysLeft = getDaysLeft(member.planEnd);
  const isInactiveMember = isInactive(member);
  const hasCompletedDocsMember = hasCompletedDocs(member);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-blue-600">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-500">
              {member.age} years • {member.gender}
            </p>
          </div>
        </div>

        <StatusBadge status={computedStatus} daysLeft={daysLeft} />
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FiPhone className="w-4 h-4" />
          <span>{member.phone}</span>
        </div>
        {member.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiMail className="w-4 h-4" />
            <span>{member.email}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FiCalendar className="w-4 h-4" />
          <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FiTarget className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Check-ins</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {member.checkInCount}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FiTrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              Membership
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${member.membershipPrice}
          </p>
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Attendance Trend
          </span>
          {isInactiveMember && (
            <FiAlertTriangle
              className="w-4 h-4 text-red-500"
              title="Inactive for more than 10 days"
            />
          )}
        </div>
        <TrendSparkline data={member.attendance} memberId={member.id} />
      </div>

      {/* Documents */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Documents</span>
          {!hasCompletedDocsMember && (
            <span className="text-xs text-red-500">Incomplete</span>
          )}
        </div>
        <DocumentChecklist
          formsSubmitted={member.formsSubmitted}
          memberId={member.id}
        />
      </div>

      {/* Tags */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700 mb-2 block">
          Tags
        </span>
        <div className="flex flex-wrap gap-1">
          {computedTags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <SmartButton
            variant="ghost"
            size="sm"
            onClick={() => onView(member)}
            className="text-blue-600 hover:text-blue-700"
          >
            <FiEye className="w-4 h-4 mr-1" />
            View
          </SmartButton>

          <SmartButton
            variant="ghost"
            size="sm"
            onClick={() => onEdit(member)}
            className="text-gray-600 hover:text-gray-700"
          >
            <FiEdit className="w-4 h-4 mr-1" />
            Edit
          </SmartButton>
        </div>

        <div className="flex items-center space-x-2">
          <WhatsAppButton member={member} template="inactive" />

          <button
            onClick={() => onDelete(member)}
            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
            title="Delete Member"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions for Inactive/Expiring Members */}
      {(isInactiveMember || (daysLeft <= 30 && daysLeft > 0)) && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-2 mb-2">
            <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {isInactiveMember
                ? "Member is inactive"
                : "Membership expiring soon"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <SmartButton
              variant="secondary"
              size="sm"
              onClick={() => {
                // Handle reminder action
              }}
              className="text-yellow-700 hover:text-yellow-800"
            >
              <FiSend className="w-3 h-3 mr-1" />
              Send Reminder
            </SmartButton>

            <WhatsAppButton member={member} template="inactive" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MemberCard;
