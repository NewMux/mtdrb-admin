import React from "react";
import {
  FiMapPin,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";
import { useRTL } from "../../hooks/useRTL";
import { useTranslation } from "react-i18next";
import { Branch } from "../../types";

interface BranchTableProps {
  branches?: Branch[];
  onEdit?: (branch: Branch) => void;
  onDelete?: (branch: Branch) => void;
  onView?: (branch: Branch) => void;
  searchTerm?: string;
}

const BranchTable: React.FC<BranchTableProps> = ({
  branches = [],
  onEdit,
  onDelete,
  onView,
  searchTerm = "",
}) => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  // Filter branches based on search term
  const filteredBranches = React.useMemo(() => {
    if (!searchTerm.trim()) return branches;
    const term = searchTerm.toLowerCase();
    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(term) ||
        branch.address?.toLowerCase().includes(term) ||
        branch.phone?.toLowerCase().includes(term) ||
        branch.email?.toLowerCase().includes(term) ||
        branch.manager_name?.toLowerCase().includes(term)
    );
  }, [branches, searchTerm]);

  // Ensure branches is always an array
  const safeBranches = Array.isArray(filteredBranches) ? filteredBranches : [];

  if (safeBranches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <FiMapPin className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t("branches.noBranches") || "No branches found"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("branches.getStarted") || "Get started by adding your first branch"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("branches.branchName") || "Branch Name"}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("branches.address") || "Address"}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("branches.contact") || "Contact"}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("branches.manager") || "Manager"}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("branches.status") || "Status"}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("common.actions") || "Actions"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {safeBranches.map((branch, index) => (
            <tr
              key={branch.id}
              className={`transition-colors ${
                hoveredRow === branch.id
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
              }`}
              onMouseEnter={() => setHoveredRow(branch.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FiMapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{branch.name}</p>
                  </div>
                </div>
              </td>
              <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {branch.address || (
                    <span className="text-gray-400 dark:text-gray-500 italic">
                      {t("branches.noAddress") || "No address"}
                    </span>
                  )}
                </p>
              </td>
              <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="space-y-1">
                  {branch.phone && (
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-1 text-sm text-gray-600 dark:text-gray-400`}>
                      <FiPhone className="w-3 h-3" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-1 text-sm text-gray-600 dark:text-gray-400`}>
                      <FiMail className="w-3 h-3" />
                      <span>{branch.email}</span>
                    </div>
                  )}
                  {!branch.phone && !branch.email && (
                    <span className="text-gray-400 dark:text-gray-500 italic text-sm">
                      {t("branches.noContact") || "No contact info"}
                    </span>
                  )}
                </div>
              </td>
              <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {branch.manager_name || (
                    <span className="text-gray-400 dark:text-gray-500 italic">
                      {t("branches.noManager") || "No manager"}
                    </span>
                  )}
                </p>
              </td>
              <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {branch.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                    <FiCheckCircle className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t("branches.active") || "Active"}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                    <FiXCircle className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t("branches.inactive") || "Inactive"}
                  </span>
                )}
              </td>
              <td className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} justify-end space-x-2`}>
                  {onView && (
                    <SmartButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(branch)}
                      className="p-2"
                    >
                      <FiEye className="w-4 h-4" />
                    </SmartButton>
                  )}
                  {onEdit && (
                    <SmartButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(branch)}
                      className="p-2"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </SmartButton>
                  )}
                  {onDelete && (
                    <SmartButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(branch)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </SmartButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BranchTable;
