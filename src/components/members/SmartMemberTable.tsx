import React, { useState, useMemo } from "react";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiUserPlus,
  FiMessageCircle,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiSend,
  FiFileText,
  FiFilter,
  FiDownload,
  FiX,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { SmartButton } from "../ui/DesignSystem";
import toast from "react-hot-toast";

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
  attendance: string[]; // Array of check-in dates
  tags: string[];
  assignedTrainerId?: string;
  fitnessGoal?: string;
}

interface SmartMemberTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onView: (member: Member) => void;
  onAssignTrainer: (member: Member) => void;
  loading?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  totalItems?: number;
}

// Status Badge Component
export const StatusBadge: React.FC<{ status: string; daysLeft?: number }> = ({
  status,
  daysLeft,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          color: "bg-green-100 text-green-800",
          icon: FiCheckCircle,
          text: "Active",
        };
      case "expired":
        return {
          color: "bg-red-100 text-red-800",
          icon: FiXCircle,
          text: "Expired",
        };
      case "payment_issue":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: FiAlertTriangle,
          text: "Payment Issue",
        };
      case "inactive":
        return {
          color: "bg-gray-100 text-gray-800",
          icon: FiClock,
          text: "Inactive",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: FiClock,
          text: "Unknown",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
      {daysLeft !== undefined && daysLeft <= 30 && daysLeft > 0 && (
        <span className="ml-1 text-xs">({daysLeft}d)</span>
      )}
    </div>
  );
};

// Tag Pill Component
export const TagPill: React.FC<{ tag: string; onRemove?: () => void }> = ({
  tag,
  onRemove,
}) => {
  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "trial":
        return "bg-blue-100 text-blue-800";
      case "loyal":
        return "bg-purple-100 text-purple-800";
      case "high performer":
        return "bg-green-100 text-green-800";
      case "at risk":
        return "bg-red-100 text-red-800";
      case "new":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
    >
      {tag}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
        >
          <FiX className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// Trend Sparkline Component
export const TrendSparkline: React.FC<{ data: string[]; memberId: string }> = ({
  data,
  memberId,
}) => {
  const getTrendDirection = (data: string[]) => {
    if (!data || !Array.isArray(data) || data.length < 2) return "stable";

    const recent = data.slice(-7).length;
    const previous = data.slice(-14, -7).length;

    if (recent > previous * 1.2) return "up";
    if (recent < previous * 0.8) return "down";
    return "stable";
  };

  const safeData = data || [];
  const trend = getTrendDirection(safeData);
  const Icon =
    trend === "up" ? FiTrendingUp : trend === "down" ? FiTrendingDown : FiClock;

  return (
    <div className="flex items-center space-x-2">
      <Icon
        className={`w-4 h-4 ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500"}`}
      />
      <span className="text-xs text-gray-600">{safeData.length} visits</span>
    </div>
  );
};

// Document Checklist Component
export const DocumentChecklist: React.FC<{
  formsSubmitted: string[];
  memberId: string;
}> = ({ formsSubmitted, memberId }) => {
  const requiredDocs = ["waiver", "id_document", "emergency_contact"];
  const safeFormsSubmitted = formsSubmitted || [];
  const completedDocs = safeFormsSubmitted.length;
  const totalDocs = requiredDocs.length;

  const handleResendDocs = () => {
    toast.success(`Document reminder sent to member ${memberId}`);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <FiFileText className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-600">
          {completedDocs}/{totalDocs}
        </span>
      </div>
      {completedDocs < totalDocs && (
        <button
          onClick={handleResendDocs}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Resend
        </button>
      )}
    </div>
  );
};

// WhatsApp CRM Button Component
export const WhatsAppButton: React.FC<{ member: Member; template: string }> = ({
  member,
  template,
}) => {
  const handleSendWhatsApp = () => {
    const templates = {
      inactive: `Hi ${member.name}, we noticed you haven't been to the gym recently. We miss you! 🏋️‍♂️`,
      expiry: `Hi ${member.name}, your membership expires in ${getDaysLeft(member.planEnd)} days. Renew now to keep your progress! 💪`,
      custom: `Hi ${member.name}, we have a special offer just for you! 🎉`,
    };

    toast.success(
      `Mock WhatsApp sent to ${member.phone}: ${templates[template as keyof typeof templates]}`,
    );
  };

  return (
    <button
      onClick={handleSendWhatsApp}
      className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
      title={`Send ${template} message`}
    >
      <FiMessageCircle className="w-4 h-4" />
    </button>
  );
};

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    // Always show at least page 1
    if (totalPages === 1) {
      return [1];
    }

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      {/* Items per page selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="form-select text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-sm text-gray-700">per page</span>
      </div>

      {/* Results info */}
      <div className="text-sm text-gray-700">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100"
          title="First page"
        >
          <FiChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100"
          title="Previous page"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100"
          title="Next page"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100"
          title="Last page"
        >
          <FiChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Utility functions
const getDaysLeft = (planEnd: string) => {
  if (!planEnd) {
    return 0; // Return 0 if no plan end date
  }

  const now = new Date();
  const end = new Date(planEnd);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatus = (member: Member) => {
  const now = new Date();

  if (!member.planEnd || !member.lastCheckIn) {
    return member.status || "inactive";
  }

  const planEnd = new Date(member.planEnd);
  const lastCheckIn = new Date(member.lastCheckIn);
  const daysSinceCheckIn =
    (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24);

  if (now > planEnd) return "expired";
  if (daysSinceCheckIn > 10) return "inactive";
  return "active";
};

const isInactive = (member: Member) => {
  if (!member.lastCheckIn) return true;

  const now = new Date();
  const lastCheckIn = new Date(member.lastCheckIn);
  const daysSinceCheckIn =
    (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceCheckIn > 10;
};

const generateTags = (member: Member) => {
  const tags = [];

  if (member.isTrial) tags.push("Trial");
  if (member.checkInCount > 20) tags.push("Loyal");
  if (member.checkInCount > 30) tags.push("High Performer");
  if (isInactive(member)) tags.push("At Risk");
  if (
    new Date(member.joinDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
    tags.push("New");

  return tags;
};

const hasCompletedDocs = (member: Member) => {
  return member.formsSubmitted && member.formsSubmitted.length >= 3;
};

const SmartMemberTable: React.FC<SmartMemberTableProps> = ({
  members,
  onEdit,
  onDelete,
  onView,
  onAssignTrainer,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  // Pagination props with defaults
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
  onPageChange = () => {},
  onItemsPerPageChange = () => {},
  totalItems = 0,
}) => {
  // Enhanced members with computed properties
  const enhancedMembers = useMemo(() => {
    return members.map((member) => ({
      ...member,
      computedStatus: getStatus(member),
      computedTags: generateTags(member),
      daysLeft: getDaysLeft(member.planEnd),
      isInactive: isInactive(member),
      hasCompletedDocs: hasCompletedDocs(member),
    }));
  }, [members]);

  // Use enhanced members directly since filtering is removed
  const filteredMembers = enhancedMembers;

  const handleSort = (field: string) => {
    onSort?.(field);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Member Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.phone}
                          </div>
                          <div className="text-xs text-gray-400">
                            Joined{" "}
                            {new Date(member.joinDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={member.computedStatus}
                        daysLeft={member.daysLeft}
                      />
                    </td>

                    {/* Last Check-in */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          {new Date(member.lastCheckIn).toLocaleDateString()}
                        </span>
                        {member.isInactive && (
                          <FiAlertTriangle
                            className="w-4 h-4 text-red-500"
                            title="Inactive for more than 10 days"
                          />
                        )}
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {member.computedTags.map((tag) => (
                          <TagPill key={tag} tag={tag} />
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onView(member)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Profile"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEdit(member)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Member"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>

                        <WhatsAppButton member={member} template="inactive" />

                        <button
                          onClick={() => onDelete(member)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Member"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <FiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No members found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new member
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default SmartMemberTable;
