import { useState, useCallback, useRef, useEffect } from "react";
import { MockMember } from "./useMockMembers";

export type ModalType =
  | "addMember"
  | "editMember"
  | "deleteMember"
  | "viewProfile"
  | "importMembers"
  | "assignTrainer";

interface ModalState {
  addMember: boolean;
  editMember: boolean;
  deleteMember: boolean;
  viewProfile: boolean;
  importMembers: boolean;
  assignTrainer: boolean;
}

interface ModalData {
  selectedMember: MockMember | null;
  memberId: string | null;
  additionalData?: any;
}

interface ModalConfig {
  type: ModalType;
  data?: Partial<ModalData>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useSmartMemberModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    addMember: false,
    editMember: false,
    deleteMember: false,
    viewProfile: false,
    importMembers: false,
    assignTrainer: false,
  });

  const [modalData, setModalData] = useState<ModalData>({
    selectedMember: null,
    memberId: null,
    additionalData: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Generic modal open/close functions with accessibility
  const openModal = useCallback((config: ModalConfig) => {
    const { type, data = {} } = config;

    setModalState((prev) => ({ ...prev, [type]: true }));
    setModalData({
      selectedMember: data.selectedMember || null,
      memberId: data.memberId || null,
      additionalData: data.additionalData || null,
    });

    // Focus management for accessibility
    setTimeout(() => {
      const firstInput = modalRef.current?.querySelector(
        "input, select, textarea",
      );
      if (firstInput instanceof HTMLElement) {
        firstInput.focus();
      }
    }, 100);
  }, []);

  const closeModal = useCallback((type: ModalType) => {
    setModalState((prev) => ({ ...prev, [type]: false }));
    setModalData({
      selectedMember: null,
      memberId: null,
      additionalData: null,
    });
    setIsLoading(false);
  }, []);

  const closeAllModals = useCallback(() => {
    setModalState({
      addMember: false,
      editMember: false,
      deleteMember: false,
      viewProfile: false,
      importMembers: false,
      assignTrainer: false,
    });
    setModalData({
      selectedMember: null,
      memberId: null,
      additionalData: null,
    });
    setIsLoading(false);
  }, []);

  // Specific modal actions with proper data handling
  const openAddMemberModal = useCallback(() => {
    openModal({ type: "addMember" });
  }, [openModal]);

  const openEditMemberModal = useCallback(
    (member: MockMember) => {
      openModal({
        type: "editMember",
        data: { selectedMember: member, memberId: member.id },
      });
    },
    [openModal],
  );

  const openDeleteMemberModal = useCallback(
    (member: MockMember) => {
      openModal({
        type: "deleteMember",
        data: { selectedMember: member, memberId: member.id },
      });
    },
    [openModal],
  );

  const openViewProfileModal = useCallback(
    (member: MockMember) => {
      openModal({
        type: "viewProfile",
        data: { selectedMember: member, memberId: member.id },
      });
    },
    [openModal],
  );

  const openImportMembersModal = useCallback(() => {
    openModal({ type: "importMembers" });
  }, [openModal]);

  const openAssignTrainerModal = useCallback(
    (member: MockMember) => {
      openModal({
        type: "assignTrainer",
        data: { selectedMember: member, memberId: member.id },
      });
    },
    [openModal],
  );

  // Success handlers with loading state management
  const handleAddMemberSuccess = useCallback(() => {
    setIsLoading(false);
    closeModal("addMember");
  }, [closeModal]);

  const handleEditMemberSuccess = useCallback(() => {
    setIsLoading(false);
    closeModal("editMember");
  }, [closeModal]);

  const handleDeleteMemberSuccess = useCallback(() => {
    setIsLoading(false);
    closeModal("deleteMember");
  }, [closeModal]);

  const handleImportMembersSuccess = useCallback(() => {
    setIsLoading(false);
    closeModal("importMembers");
  }, [closeModal]);

  const handleAssignTrainerSuccess = useCallback(() => {
    setIsLoading(false);
    closeModal("assignTrainer");
  }, [closeModal]);

  // Error handlers
  const handleModalError = useCallback((error: Error) => {
    setIsLoading(false);
    console.error("Modal operation failed:", error);
  }, []);

  // Keyboard navigation and accessibility
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const openModalType = Object.entries(modalState).find(
          ([_, isOpen]) => isOpen,
        )?.[0] as ModalType;
        if (openModalType) {
          closeModal(openModalType);
        }
      }
    };

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const hasOpenModal = Object.values(modalState).some((isOpen) => isOpen);

    if (hasOpenModal) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTabKey);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
      document.body.style.overflow = "unset";
    };
  }, [modalState, closeModal]);

  // Set loading state for async operations
  const setModalLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    // Modal state
    modalState,
    modalData,
    isLoading,
    modalRef,

    // Generic actions
    openModal,
    closeModal,
    closeAllModals,
    setModalLoading,

    // Specific modal actions
    openAddMemberModal,
    openEditMemberModal,
    openDeleteMemberModal,
    openViewProfileModal,
    openImportMembersModal,
    openAssignTrainerModal,

    // Success handlers
    handleAddMemberSuccess,
    handleEditMemberSuccess,
    handleDeleteMemberSuccess,
    handleImportMembersSuccess,
    handleAssignTrainerSuccess,

    // Error handlers
    handleModalError,
  };
};
