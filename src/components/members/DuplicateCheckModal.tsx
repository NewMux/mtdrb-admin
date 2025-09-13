import React, { useState } from "react";
import { FiX, FiAlertTriangle, FiTrash2, FiGitMerge } from "react-icons/fi";
import { supabase } from "../../supabaseClient";

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface DuplicateCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: {
    [key: string]: Array<{
      value: string;
      members: Member[];
    }>;
  };
  onActionComplete?: () => void;
}

interface DuplicateGroup {
  field: string;
  value: string;
  members: Member[];
}

export default function DuplicateCheckModal({
  isOpen,
  onClose,
  duplicates,
  onActionComplete,
}: DuplicateCheckModalProps) {
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(
    new Set(),
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"merge" | "delete" | null>(null);

  if (!isOpen) return null;

  const hasDuplicates = Object.keys(duplicates).length > 0;

  // Convert duplicates object to a more manageable format
  const duplicateGroups: DuplicateGroup[] = [];
  Object.entries(duplicates).forEach(([field, groups]) => {
    groups.forEach((group) => {
      duplicateGroups.push({
        field,
        value: group.value,
        members: group.members,
      });
    });
  });

  const handleSelectDuplicate = (value: string) => {
    const newSelected = new Set(selectedDuplicates);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setSelectedDuplicates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDuplicates.size === duplicateGroups.length) {
      setSelectedDuplicates(new Set());
    } else {
      setSelectedDuplicates(
        new Set(
          duplicateGroups.map((group) => `${group.field}:${group.value}`),
        ),
      );
    }
  };

  const handleMerge = async () => {
    setActionLoading(true);
    setActionType("merge");

    try {
      const mergeOperations: Array<{
        primaryId: string;
        duplicateIds: string[];
        mergedData: Partial<Member>;
      }> = [];

      // Prepare merge operations for each selected duplicate group
      selectedDuplicates.forEach((duplicateKey) => {
        const [field, value] = duplicateKey.split(":");
        const group = duplicateGroups.find(
          (g) => g.field === field && g.value === value,
        );

        if (group && group.members.length > 1) {
          const primaryMember = group.members[0]; // Keep the first member as primary
          const duplicateMembers = group.members.slice(1);

          // Merge data from all members, keeping the most complete information
          const mergedData: Partial<Member> = {
            name: primaryMember.name,
            email:
              primaryMember.email ||
              duplicateMembers.find((m) => m.email)?.email ||
              undefined,
            phone:
              primaryMember.phone ||
              duplicateMembers.find((m) => m.phone)?.phone ||
              undefined,
          };

          mergeOperations.push({
            primaryId: primaryMember.id,
            duplicateIds: duplicateMembers.map((m) => m.id),
            mergedData,
          });
        }
      });

      if (mergeOperations.length === 0) {
        alert("No duplicates selected for merging.");
        return;
      }

      // Perform merge operations
      for (const operation of mergeOperations) {
        // Update the primary member with merged data
        const { error: updateError } = await supabase
          .from("members")
          .update(operation.mergedData)
          .eq("id", operation.primaryId);

        if (updateError) {
          throw updateError;
        }

        // Delete the duplicate members
        if (operation.duplicateIds.length > 0) {
          const { error: deleteError } = await supabase
            .from("members")
            .delete()
            .in("id", operation.duplicateIds);

          if (deleteError) {
            throw deleteError;
          }
        }
      }

      const totalDeleted = mergeOperations.reduce(
        (sum, op) => sum + op.duplicateIds.length,
        0,
      );
      alert(
        `Successfully merged ${mergeOperations.length} duplicate group(s) and deleted ${totalDeleted} duplicate member(s).`,
      );

      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error("Error merging duplicates:", error);
      alert("Failed to merge duplicates. Please try again.");
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete the selected duplicate members? This action cannot be undone.",
      )
    ) {
      return;
    }

    setActionLoading(true);
    setActionType("delete");

    try {
      // Get all member IDs to delete from selected duplicates
      const memberIdsToDelete: string[] = [];

      selectedDuplicates.forEach((duplicateKey) => {
        const [field, value] = duplicateKey.split(":");
        const group = duplicateGroups.find(
          (g) => g.field === field && g.value === value,
        );
        if (group) {
          // Add all member IDs except the first one (keep one as primary)
          group.members.slice(1).forEach((member) => {
            memberIdsToDelete.push(member.id);
          });
        }
      });

      if (memberIdsToDelete.length === 0) {
        alert("No members selected for deletion.");
        return;
      }

      // Delete the duplicate members
      const { error } = await supabase
        .from("members")
        .delete()
        .in("id", memberIdsToDelete);

      if (error) {
        throw error;
      }

      alert(
        `Successfully deleted ${memberIdsToDelete.length} duplicate member(s).`,
      );

      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error("Error deleting duplicates:", error);
      alert("Failed to delete duplicates. Please try again.");
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const handleClose = () => {
    setSelectedDuplicates(new Set());
    setActionLoading(false);
    setActionType(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiAlertTriangle
              size={24}
              className={hasDuplicates ? "text-yellow-500" : "text-green-500"}
            />
            <h2 className="text-xl font-semibold">
              {hasDuplicates
                ? "Duplicate Members Found"
                : "No Duplicates Found"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={actionLoading}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
          {hasDuplicates ? (
            <div className="space-y-6">
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedDuplicates.size === duplicateGroups.length &&
                        duplicateGroups.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={actionLoading}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({selectedDuplicates.size}/
                      {duplicateGroups.length})
                    </span>
                  </label>
                </div>

                {selectedDuplicates.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMerge}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {actionLoading && actionType === "merge" ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FiGitMerge size={16} />
                      )}
                      <span>Merge Selected</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {actionLoading && actionType === "delete" ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FiTrash2 size={16} />
                      )}
                      <span>Delete Selected</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Duplicate Groups */}
              {duplicateGroups.map((group, index) => {
                const groupKey = `${group.field}:${group.value}`;
                const isSelected = selectedDuplicates.has(groupKey);

                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectDuplicate(groupKey)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={actionLoading}
                          />
                          <span className="font-medium text-gray-900">
                            {group.field.charAt(0).toUpperCase() +
                              group.field.slice(1)}
                            : {group.value}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({group.members.length} members)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {group.members.map((member, memberIndex) => (
                          <div
                            key={memberIndex}
                            className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                          >
                            <FiAlertTriangle
                              size={16}
                              className="text-yellow-600 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-yellow-800">
                                {member.name}
                              </div>
                              {member.email && (
                                <div className="text-sm text-yellow-700">
                                  Email: {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="text-sm text-yellow-700">
                                  Phone: {member.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-600">
              No duplicates were found in the selected members.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={actionLoading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
