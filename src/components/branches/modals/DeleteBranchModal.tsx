import * as React from "react";
import { FiAlertTriangle, FiMapPin } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { SmartButton } from "../../ui/DesignSystem";
import { api } from "../../../api/client";
import { Branch } from "../../../types";

interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  onSuccess?: () => void;
}

export default function DeleteBranchModal({
  isOpen,
  onClose,
  branch,
  onSuccess,
}: DeleteBranchModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await api.branches.delete(branch.id);

      if (error) throw error;

      toast.success(
        t("branches.branchDeletedSuccessfully") || `${branch.name} has been deleted successfully!`
      );
      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      toast.error(
        error.message || t("branches.errors.failedToDeleteBranch") || "Failed to delete branch"
      );
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const footer = (
    <>
      <SmartButton variant="secondary" onClick={handleClose} disabled={loading}>
        {t("common.cancel") || "Cancel"}
      </SmartButton>
      <SmartButton
        variant="danger"
        onClick={handleDelete}
        loading={loading}
        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
      >
        {loading ? (t("branches.deleting") || "Deleting...") : (t("branches.deleteBranch") || "Delete Branch")}
      </SmartButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("branches.deleteBranch") || "Delete Branch"}
      subtitle={t("branches.deleteBranchDesc") || "This action cannot be undone"}
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <div className="space-y-8">
        {/* Warning Message Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600">
              <FiAlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("branches.confirmDelete") || "Confirm Deletion"}
            </h3>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-4`}>
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              </div>
              <div>
                <h3 className={`text-base font-semibold text-red-900 mb-1 ${isRTL ? 'text-right' : ''}`}>
                  {t("branches.confirmDelete") || "Are you sure you want to delete this branch?"}
                </h3>
                <p className={`text-sm text-red-700 leading-relaxed ${isRTL ? 'text-right' : ''}`}>
                  {t("branches.deleteWarning") || "This will permanently remove"} <strong>{branch.name}</strong>{" "}
                  {t("branches.deleteWarning2") || "from the system and cannot be undone. All associated data will be lost."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Branch Details Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiMapPin className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("branches.branchInformation") || "Branch Information"}
            </h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-5">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-4`}>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiMapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-semibold text-gray-900 mb-2 ${isRTL ? 'text-right' : ''}`}>
                  {branch.name}
                </h4>
                {branch.address && (
                  <p className={`text-sm text-gray-600 mb-1 ${isRTL ? 'text-right' : ''}`}>
                    {branch.address}
                  </p>
                )}
                {branch.phone && (
                  <p className={`text-sm text-gray-600 mb-1 ${isRTL ? 'text-right' : ''}`}>
                    {branch.phone}
                  </p>
                )}
                {branch.email && (
                  <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : ''}`}>
                    {branch.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </UnifiedModal>
  );
}
