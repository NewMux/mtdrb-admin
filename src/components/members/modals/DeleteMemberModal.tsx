import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { Member } from "../../../types/member";

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  onSuccess: (member: Member) => Promise<void>;
  loading?: boolean;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSuccess,
  loading = false,
  modalRef,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!member) return;

    try {
      setIsDeleting(true);
      await onSuccess(member);
    } catch (error) {
      console.error("Failed to delete member:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  if (!member) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title="Delete Member"
          subtitle={`Remove ${member?.name || "this member"} from the system`}
          footer={
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiAlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">
                  This action cannot be undone
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <SmartButton variant="secondary" onClick={onClose}>
                  Cancel
                </SmartButton>
                <SmartButton
                  variant="danger"
                  icon={<FiTrash2 className="w-4 h-4" />}
                  onClick={handleDelete}
                  loading={loading}
                >
                  {loading ? "Deleting..." : "Delete Member"}
                </SmartButton>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Member Information */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Are you sure you want to delete this member?
              </h3>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {member.avatar}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.status === "active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                            : member.status === "inactive"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              : "bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200"
                        }`}
                      >
                        {member.status.charAt(0).toUpperCase() +
                          member.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {member.membershipType} Member
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">
                    This action will permanently delete:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Member profile and all associated data</li>
                    <li>Membership history and payment records</li>
                    <li>Class attendance and booking history</li>
                    <li>Personal trainer assignments</li>
                    <li>All notes and communication history</li>
                  </ul>
                  <p className="mt-2 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Alternative Actions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiUser className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">
                    Consider these alternatives instead:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Change status to "Inactive" to preserve data</li>
                    <li>Archive the member profile</li>
                    <li>Export member data before deletion</li>
                    <li>Contact the member to confirm their intent</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default DeleteMemberModal;
