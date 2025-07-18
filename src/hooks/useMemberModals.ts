import { useState, useCallback } from 'react';
import { MockMember } from './useMockMembers';

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
}

export const useMemberModals = () => {
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
  });

  // Generic modal open/close functions
  const openModal = useCallback((modalName: keyof ModalState, member?: MockMember) => {
    setModalState(prev => ({ ...prev, [modalName]: true }));
    if (member) {
      setModalData({ selectedMember: member, memberId: member.id });
    }
  }, []);

  const closeModal = useCallback((modalName: keyof ModalState) => {
    setModalState(prev => ({ ...prev, [modalName]: false }));
    setModalData({ selectedMember: null, memberId: null });
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
    setModalData({ selectedMember: null, memberId: null });
  }, []);

  // Specific modal actions
  const openAddMemberModal = useCallback(() => {
    openModal('addMember');
  }, [openModal]);

  const openEditMemberModal = useCallback((member: MockMember) => {
    openModal('editMember', member);
  }, [openModal]);

  const openDeleteMemberModal = useCallback((member: MockMember) => {
    openModal('deleteMember', member);
  }, [openModal]);

  const openViewProfileModal = useCallback((member: MockMember) => {
    openModal('viewProfile', member);
  }, [openModal]);

  const openImportMembersModal = useCallback(() => {
    openModal('importMembers');
  }, [openModal]);

  const openAssignTrainerModal = useCallback((member: MockMember) => {
    openModal('assignTrainer', member);
  }, [openModal]);



  // Modal success handlers
  const handleAddMemberSuccess = useCallback(() => {
    closeModal('addMember');
  }, [closeModal]);

  const handleEditMemberSuccess = useCallback(() => {
    closeModal('editMember');
  }, [closeModal]);

  const handleDeleteMemberSuccess = useCallback(() => {
    closeModal('deleteMember');
  }, [closeModal]);

  const handleImportMembersSuccess = useCallback(() => {
    closeModal('importMembers');
  }, [closeModal]);

  const handleAssignTrainerSuccess = useCallback(() => {
    closeModal('assignTrainer');
  }, [closeModal]);



  return {
    // Modal state
    modalState,
    modalData,
    
    // Generic actions
    openModal,
    closeModal,
    closeAllModals,
    
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
  };
}; 