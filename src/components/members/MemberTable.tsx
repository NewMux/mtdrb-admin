import * as React from "react";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiUser,
  FiChevronUp,
  FiChevronDown,
  FiSearch,
} from "react-icons/fi";
import { Member } from "../../types/member";
import { SmartButton, EmptyState } from "../ui/DesignSystem";
import { useTranslation } from "react-i18next";

interface MemberTableProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  onView?: (member: Member) => void;
  onAssignTrainer?: (member: Member) => void;
  loading?: boolean;
  sortBy?: keyof Member;
  sortOrder?: "asc" | "desc";
  onSort?: (field: keyof Member) => void;
}

const MemberTable: React.FC<MemberTableProps> = ({
  members,
  onEdit,
  onDelete,
  onView,
  onAssignTrainer,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const { t } = useTranslation();
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);
  const [focusedRow, setFocusedRow] = React.useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-gold-100 text-gold-800";
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

  const handleSort = (field: keyof Member) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: keyof Member) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <FiChevronUp className="w-4 h-4" />
    ) : (
      <FiChevronDown className="w-4 h-4" />
    );
  };

  const getSortLabel = (field: keyof Member) => {
    const currentSort = sortBy === field ? sortOrder : "none";
    return `${field} sorted ${currentSort}`;
  };

  const getAriaSort = (field: keyof Member) => {
    if (sortBy !== field || !sortOrder) return "none";
    return sortOrder === "asc" ? "ascending" : "descending";
  };

  // Enhanced loading state with better UX
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-600 font-medium">
            Loading members...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Please wait while we fetch the latest data
          </p>
        </div>
      </div>
    );
  }

  // Enhanced empty state with better messaging
  if (members.length === 0) {
    return (
      <EmptyState
        icon={<FiUser className="w-8 h-8" />}
        title="No members found"
        description="Try adjusting your search or filter criteria to find what you're looking for."
        action={
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <FiSearch className="w-4 h-4" />
            <span>Use the search bar above to find specific members</span>
          </div>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="Members table">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700"
                scope="col"
              >
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center space-x-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel("name")}
                  aria-sort={getAriaSort("name")}
                >
                  <span>Member</span>
                  {getSortIcon("name")}
                </button>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700"
                scope="col"
              >
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center space-x-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel("email")}
                  aria-sort={getAriaSort("email")}
                >
                  <span>Contact</span>
                  {getSortIcon("email")}
                </button>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700"
                scope="col"
              >
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center space-x-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel("status")}
                  aria-sort={getAriaSort("status")}
                >
                  <span>Status</span>
                  {getSortIcon("status")}
                </button>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700"
                scope="col"
              >
                <button
                  onClick={() => handleSort("membership_type")}
                  className="flex items-center space-x-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel("membership_type")}
                  aria-sort={getAriaSort("membership_type")}
                >
                  <span>Membership</span>
                  {getSortIcon("membership_type")}
                </button>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700"
                scope="col"
              >
                <button
                  onClick={() => handleSort("join_date")}
                  className="flex items-center space-x-1 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={getSortLabel("join_date")}
                  aria-sort={getAriaSort("join_date")}
                >
                  <span>Last Visit</span>
                  {getSortIcon("join_date")}
                </button>
              </th>
              <th
                className="px-6 py-4 text-right text-sm font-medium text-gray-700"
                scope="col"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member, index) => {
              const memberName = member.name ?? "Unnamed member";
              const joinDateValue = member.join_date ?? member.created_at;
              const initials = memberName
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-gray-50 transition-colors duration-200 ${
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50/50/50"
                  } ${
                    focusedRow === member.id
                      ? "ring-2 ring-sky-500 ring-inset"
                      : ""
                  }`}
                  onMouseEnter={() => setHoveredRow(member.id ?? null)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onFocus={() => setFocusedRow(member.id ?? null)}
                  onBlur={() => setFocusedRow(null)}
                  tabIndex={0}
                  role="row"
                  aria-label={`Member row for ${memberName}`}
                >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center flex-shrink-0"
                      aria-label={`Avatar for ${memberName}`}
                    >
                      <span className="text-white font-medium text-sm">
                        {initials || "?"}
                      </span>
                    </div>
                    <div className="text-start">
                      <div className="text-sm font-medium text-gray-900">
                        {memberName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t("members.joinDate", "تاريخ الانضمام")}{" "}
                        {joinDateValue
                          ? new Date(joinDateValue).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900">
                      <a
                        href={`mailto:${member.email}`}
                        className="hover:text-sky-600 transition-colors"
                        aria-label={`Send email to ${member.name}`}
                      >
                        {member.email}
                      </a>
                    </div>
                    <div className="text-xs text-gray-500">
                      <a
                        href={`tel:${member.phone}`}
                        className="hover:text-sky-600 transition-colors"
                        aria-label={`Call ${member.name}`}
                      >
                        {member.phone}
                      </a>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      member.status ?? "inactive",
                    )}`}
                    aria-label={`Status: ${member.status ?? "inactive"}`}
                  >
                    {(member.status ?? "inactive").charAt(0).toUpperCase() +
                      (member.status ?? "inactive").slice(1)}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMembershipColor(
                      member.membership_type ?? "Standard",
                    )}`}
                    aria-label={`Membership type: ${
                      member.membership_type ?? "Standard"
                    }`}
                  >
                    {member.membership_type ?? "Standard"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                  {joinDateValue
                    ? new Date(joinDateValue).toLocaleDateString()
                    : "Never"}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div
                    className={`flex items-center justify-end space-x-1 transition-opacity duration-200 ${
                      hoveredRow === member.id || focusedRow === member.id
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    role="group"
                    aria-label={`Actions for ${member.name}`}
                  >
                    {onView && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiEye className="w-4 h-4" />}
                        onClick={() => onView(member)}
                        className="p-1"
                        title="View Profile"
                        aria-label={`View profile for ${member.name}`}
                      />
                    )}

                    {onEdit && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiEdit className="w-4 h-4" />}
                        onClick={() => onEdit(member)}
                        className="p-1"
                        title="Edit Member"
                        aria-label={`Edit ${member.name}`}
                      />
                    )}

                    {onAssignTrainer && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiUser className="w-4 h-4" />}
                        onClick={() => onAssignTrainer(member)}
                        className="p-1"
                        title="Assign Trainer"
                        aria-label={`Assign trainer to ${member.name}`}
                      />
                    )}

                    {onDelete && (
                      <SmartButton
                        variant="ghost"
                        size="sm"
                        icon={<FiTrash2 className="w-4 h-4" />}
                        onClick={() => onDelete(member)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Delete Member"
                        aria-label={`Delete ${member.name}`}
                      />
                    )}
                  </div>
                </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTable;
