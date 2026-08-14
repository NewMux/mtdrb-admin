import React, { useMemo } from "react";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiMessageCircle,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiFileText,
  FiX,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiUserX,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { usePermissions } from "../../hooks/usePermissions";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

interface Member {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  age: number;
  gender: string;
  joinDate: string;
  planEnd: string;
  lastCheckIn: string;
  checkInCount: number;
  status: "active" | "inactive" | "suspended" | "expired" | "trial";
  membershipPrice: number;
  formsSubmitted: string[];
  isTrial: boolean;
  attendance: string[]; // Array of check-in dates
  tags: string[];
  assignedTrainerId?: string;
  fitnessGoal?: string;
}

export type SmartMember = Member;

interface SmartMemberTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onCancelMembership?: (member: Member) => void;
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
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
          icon: FiCheckCircle,
          text: isArabic ? "نشط" : "Active",
        };
      case "expired":
        return {
          color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
          icon: FiXCircle,
          text: isArabic ? "منتهي" : "Expired",
        };
      case "payment_issue":
        return {
          color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
          icon: FiAlertTriangle,
          text: isArabic ? "مشكلة دفع" : "Payment Issue",
        };
      case "inactive":
        return {
          color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
          icon: FiClock,
          text: isArabic ? "غير نشط" : "Inactive",
        };
      default:
        return {
          color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
          icon: FiClock,
          text: isArabic ? "غير معروف" : "Unknown",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.text}</span>
      {daysLeft !== undefined && daysLeft <= 30 && daysLeft > 0 && (
        <span className="text-xs">({daysLeft} {t("members.daysLeft")})</span>
      )}
    </div>
  );
};

// Tag Pill Component
export const TagPill: React.FC<{ tag: string; onRemove?: () => void }> = ({
  tag,
  onRemove,
}) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const getTagConfig = (tagStr: string) => {
    const lower = tagStr.toLowerCase();
    switch (lower) {
      case "trial":
        return {
          color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
          label: isArabic ? "تجريبي" : "Trial",
        };
      case "loyal":
        return {
          color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400",
          label: isArabic ? "وفي" : "Loyal",
        };
      case "high performer":
        return {
          color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
          label: isArabic ? "أداء عالٍ" : "High Performer",
        };
      case "at risk":
        return {
          color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
          label: isArabic ? "معرض للخطر" : "At Risk",
        };
      case "new":
        return {
          color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400",
          label: isArabic ? "جديد" : "New",
        };
      default:
        return {
          color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
          label: tagStr,
        };
    }
  };

  const config = getTagConfig(tag);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span>{config.label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
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
}) => {
  const { t } = useTranslation();
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
        className={`w-4 h-4 ${trend === "up" ? "text-green-500 dark:text-green-400" : trend === "down" ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}
      />
      <span className="text-xs text-gray-600 dark:text-gray-400">{safeData.length} {t("members.visits")}</span>
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
  const { t } = useTranslation();
  const { isRTL } = useRTL();
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
    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700`}>
      {/* Items per page selector */}
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2`}>
        <span className="text-sm text-gray-700 dark:text-gray-300">{t("members.show")}</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="form-select text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-sm text-gray-700 dark:text-gray-300">{t("members.perPage")}</span>
      </div>

      {/* Results info */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {t("members.showing")} {startItem} {t("members.to")} {endItem} {t("members.of")} {totalItems} {t("members.results")}
      </div>

      {/* Pagination controls */}
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-1`}>
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          title={t("members.firstPage")}
        >
          <FiChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          title={t("members.previousPage")}
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          title={t("members.nextPage")}
        >
          <FiChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          title={t("members.lastPage")}
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
  onCancelMembership,
  onView,
  loading = false,
  // Pagination props with defaults
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
  onPageChange = () => {},
  onItemsPerPageChange = () => {},
  totalItems = 0,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  // Permission checks
  const { canEdit, canDelete } = usePermissions();
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

  if (loading) {
    return (
      <div className="card dark:bg-gray-800">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Table */}
      <div className="card overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                  {t("members.name")}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                  {t("common.status")}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                  {t("members.lastCheckin")}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                  {t("members.tags")}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                  {t("members.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {/* Member Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-start">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.phone}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {t("members.joinDate")}{" "}
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
                      <div className="flex items-center gap-2 text-start">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(member.lastCheckIn).toLocaleDateString()}
                        </span>
                        {member.isInactive && (
                          <FiAlertTriangle
                            className="w-4 h-4 text-red-500 dark:text-red-400"
                            title={t("members.inactive")}
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(member)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title={t("members.viewProfile")}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => onEdit(member)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            title={t("members.editMember")}
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                        )}

                        <WhatsAppButton member={member} template="inactive" />

                        {onCancelMembership && member.status === "active" && (
                          <button
                            onClick={() => onCancelMembership(member)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
                            title={t("members.cancelMembership", "Cancel Membership")}
                          >
                            <FiUserX className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDelete(member)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title={t("members.deleteMember")}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
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
            <FiUser className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {t("members.noMembersFound")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("members.getStartedCreating")}
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
