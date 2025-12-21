import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiTarget,
  FiHeart,
  FiFileText,
  FiActivity,
  FiTrendingUp,
  FiClock,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { Member } from "../../../types/member";

interface ViewMemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const ViewMemberProfileModal: React.FC<ViewMemberProfileModalProps> = ({
  isOpen,
  onClose,
  member,
  modalRef,
}) => {
  if (!member) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "Premium":
        return "bg-rose-100 text-rose-800";
      case "Standard":
        return "bg-sky-100 text-sky-800";
      case "Basic":
        return "bg-gray-100 text-gray-800";
      case "VIP":
        return "bg-purple-100 text-purple-800";
      case "Student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-blue-100 text-blue-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title="Member Profile"
          subtitle={`Viewing profile for ${member.name}`}
        >
          <div className="space-y-8">
            {/* Header with Avatar and Basic Info */}
            <div className="flex items-start gap-5 pb-6 border-b border-gray-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center shadow-lg ring-4 ring-sky-100">
                <span className="text-white font-semibold text-xl">
                  {member.avatar}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h2>
                <p className="text-gray-600 font-medium mb-3">
                  {member.email}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${getStatusColor(member.status)}`}
                  >
                    {member.status.charAt(0).toUpperCase() +
                      member.status.slice(1)}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${getMembershipColor(member.membershipType)}`}
                  >
                    {member.membershipType}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${getFitnessLevelColor(member.fitness_level || "beginner")}`}
                  >
                    {member.fitness_level?.charAt(0).toUpperCase() +
                      member.fitness_level?.slice(1) || "Beginner"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiUser className="w-5 h-5 mr-2" />
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiMail className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiPhone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {member.phone}
                    </p>
                  </div>
                </div>

                {member.address && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors md:col-span-2">
                    <div className="p-2 bg-white rounded-lg">
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Address</p>
                      <p className="text-sm font-medium text-gray-900">
                        {member.address}
                      </p>
                    </div>
                  </div>
                )}

                {member.emergency_contact && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg">
                      <FiPhone className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Emergency Contact</p>
                      <p className="text-sm font-medium text-gray-900">
                        {member.emergency_contact}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Membership Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiCalendar className="w-5 h-5 mr-2" />
                Membership Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiCalendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Join Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(member.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiActivity className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Last Visit</p>
                    <p className="text-sm font-medium text-gray-900">
                      {member.lastVisit === "Never"
                        ? "Never"
                        : new Date(member.lastVisit).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiTrendingUp className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Membership Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {member.membershipType}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness Profile */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiTarget className="w-5 h-5 mr-2" />
                Fitness Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.goals && member.goals.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiTarget className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Fitness Goals
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {goal
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.health_conditions &&
                  member.health_conditions.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <FiHeart className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Health Conditions
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {member.health_conditions.map((condition, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                          >
                            {condition
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Trainer Assignment */}
            {member.trainer_id && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiUser className="w-5 h-5 mr-2" />
                  Personal Trainer
                </h3>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-400 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">PT</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Personal Trainer
                      </p>
                      <p className="text-sm text-gray-500">
                        Assigned trainer ID: {member.trainer_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {member.notes && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiFileText className="w-5 h-5 mr-2" />
                  Notes
                </h3>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {member.notes}
                  </p>
                </div>
              </div>
            )}

          </div>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default ViewMemberProfileModal;
