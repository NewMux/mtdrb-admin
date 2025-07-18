import * as React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiDownload, FiUsers, FiUserPlus, FiActivity, FiBarChart, FiUpload } from 'react-icons/fi';
import SmartMemberTable from '../components/members/SmartMemberTable';
import SmartMemberAnalytics from '../components/members/SmartMemberAnalytics';
import SmartMemberOnboardingModal from '../components/members/SmartMemberOnboardingModal';
import MemberProfileDrawer from '../components/members/MemberProfileDrawer';
import { AnimatePresence } from 'framer-motion';
import FilterButton from '../components/ui/FilterButton';
import TabsNav from '../components/ui/TabsNav';
import AddButton from '../components/ui/AddButton';
import { SmartButton } from '../components/ui/DesignSystem';
import ToastContainer from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { usePageThemeContext } from '../contexts/PageThemeContext';

// Import modal components
import {
  AddMemberModal,
  EditMemberModal,
  DeleteMemberModal,
  ViewMemberProfileModal,
  ImportMembersModal,
  AssignTrainerModal
} from '../components/members/modals';

// Import hooks
import { useMockMembers, MockMember } from '../hooks/useMockMembers';
import { useSmartMemberModal } from '../hooks/useSmartMemberModal';
import MemberModal from '../components/members/MemberModal';
import AnalyticsTab from '../components/members/tabs/AnalyticsTab';

// Type adapter to convert MockMember to Member
const convertMockMemberToMember = (mockMember: MockMember) => ({
  id: mockMember.id,
  name: mockMember.name,
  email: mockMember.email,
  phone: mockMember.phone,
  age: 25, // Default age
  gender: mockMember.gender || 'other',
  joinDate: mockMember.joinDate,
  planEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
  lastCheckIn: mockMember.lastVisit === 'Never' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : mockMember.lastVisit,
  checkInCount: Math.floor(Math.random() * 50) + 1,
  status: mockMember.status === 'active' ? 'active' : mockMember.status === 'inactive' ? 'inactive' : 'expired',
  membershipPrice: 99.99,
  formsSubmitted: ['waiver'],
  isTrial: false,
  attendance: [mockMember.lastVisit === 'Never' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : mockMember.lastVisit],
  tags: mockMember.status === 'active' ? ['active'] : ['inactive'],
  assignedTrainerId: mockMember.trainer_id,
  fitnessGoal: mockMember.goals?.[0] || 'general_fitness'
});

const Members: React.FC = () => {
  const { theme } = usePageThemeContext();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
  // Use custom hooks for data and modal management
  const {
    members,
    searchTerm,
    setSearchTerm,
    selectedFilter,
    setSelectedFilter,
    sortBy,
    sortOrder,
    updateSorting,
    loading,
    stats,
    addMember,
    editMember,
    deleteMember,
    // Pagination from hook
    currentPage,
    totalPages,
    itemsPerPage,
    updateItemsPerPage,
    goToPage
  } = useMockMembers();

  // Convert MockMembers to Members for SmartMemberTable
  const convertedMembers = React.useMemo(() => 
    members.map(convertMockMemberToMember), 
    [members]
  );

  // Pagination handlers using hook functions
  const handlePageChange = React.useCallback((page: number) => {
    goToPage(page);
  }, [goToPage]);

  const handleItemsPerPageChange = React.useCallback((newItemsPerPage: number) => {
    updateItemsPerPage(newItemsPerPage);
  }, [updateItemsPerPage]);

  // Get total items count for pagination display
  const totalItems = React.useMemo(() => {
    // Get the total count from the hook's stats
    return stats.total;
  }, [stats.total]);

  // Reset pagination when search/filter changes
  React.useEffect(() => {
    // setCurrentPage(1); // This is now handled by goToPage from the hook
  }, [searchTerm, selectedFilter]);

  const {
    modalState,
    modalData,
    isLoading: modalLoading,
    modalRef,
    openAddMemberModal,
    openEditMemberModal,
    openDeleteMemberModal,
    openViewProfileModal,
    openImportMembersModal,
    openAssignTrainerModal,
    handleAddMemberSuccess,
    handleEditMemberSuccess,
    handleDeleteMemberSuccess,
    handleImportMembersSuccess,
    handleAssignTrainerSuccess,
    closeModal,
    setModalLoading,
    handleModalError
  } = useSmartMemberModal();

  // Toast system
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: FiUsers },
    { id: 'analytics', name: 'Analytics', icon: FiBarChart },
    { id: 'list', name: 'Member List', icon: FiUserPlus },
  ];

  const filters = [
    { id: 'all', name: 'All Members', count: stats.total },
    { id: 'active', name: 'Active', count: stats.active },
    { id: 'inactive', name: 'Inactive', count: stats.inactive },
    { id: 'new', name: 'New This Month', count: stats.newThisMonth },
  ];

  // Enhanced member action handlers with error handling
  const handleEditMember = React.useCallback((member: any) => {
    try {
      // Find the original MockMember
      const originalMember = members.find(m => m.id === member.id);
      if (originalMember) {
        openEditMemberModal(originalMember);
      }
    } catch (error) {
      showError('Error', 'Failed to open edit modal. Please try again.');
      console.error('Error opening edit modal:', error);
    }
  }, [openEditMemberModal, showError, members]);

  const handleDeleteMember = React.useCallback((member: any) => {
    try {
      // Find the original MockMember
      const originalMember = members.find(m => m.id === member.id);
      if (originalMember) {
        openDeleteMemberModal(originalMember);
      }
    } catch (error) {
      showError('Error', 'Failed to open delete modal. Please try again.');
      console.error('Error opening delete modal:', error);
    }
  }, [openDeleteMemberModal, showError, members]);

  const handleViewMember = React.useCallback((member: any) => {
    try {
      // Find the original MockMember
      const originalMember = members.find(m => m.id === member.id);
      if (originalMember) {
        openViewProfileModal(originalMember);
      }
    } catch (error) {
      showError('Error', 'Failed to open profile modal. Please try again.');
      console.error('Error opening profile modal:', error);
    }
  }, [openViewProfileModal, showError, members]);

  const handleAssignTrainer = React.useCallback((member: any) => {
    try {
      // Find the original MockMember
      const originalMember = members.find(m => m.id === member.id);
      if (originalMember) {
        openAssignTrainerModal(originalMember);
      }
    } catch (error) {
      showError('Error', 'Failed to open trainer assignment modal. Please try again.');
      console.error('Error opening trainer assignment modal:', error);
    }
  }, [openAssignTrainerModal, showError, members]);

  // Enhanced form submission handlers with proper error handling
  const [showSmartOnboarding, setShowSmartOnboarding] = React.useState(false);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = React.useState<any>(null);

  const handleAddMember = React.useCallback(async (memberData: any) => {
    setModalLoading(true);
    try {
      await addMember(memberData);
      handleAddMemberSuccess();
      showSuccess('Member Added', 'The member has been successfully added to the system.');
    } catch (error) {
      handleModalError(error as Error);
      showError('Add Failed', error instanceof Error ? error.message : 'Failed to add member. Please try again.');
    }
  }, [addMember, handleAddMemberSuccess, handleModalError, setModalLoading, showSuccess, showError]);

  const handleEditMemberSubmit = React.useCallback(async (memberId: string, memberData: any) => {
    setModalLoading(true);
    try {
      await editMember(memberId, memberData);
      handleEditMemberSuccess();
      showSuccess('Member Updated', 'The member information has been successfully updated.');
    } catch (error) {
      handleModalError(error as Error);
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update member. Please try again.');
    }
  }, [editMember, handleEditMemberSuccess, handleModalError, setModalLoading, showSuccess, showError]);

  const handleDeleteMemberSubmit = React.useCallback(async (member: any) => {
    setModalLoading(true);
    try {
      await deleteMember(member.id);
      handleDeleteMemberSuccess();
      showSuccess('Member Deleted', 'The member has been successfully removed from the system.');
    } catch (error) {
      handleModalError(error as Error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete member. Please try again.');
    }
  }, [deleteMember, handleDeleteMemberSuccess, handleModalError, setModalLoading, showSuccess, showError]);

  // Enhanced export functionality with error handling
  const handleExport = React.useCallback(() => {
    try {
      // Simulate export functionality
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Name,Email,Phone,Status,Membership Type,Join Date\n" +
        members.map(m => `${m.name},${m.email},${m.phone},${m.status},${m.membershipType},${m.joinDate}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "members_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess('Export Successful', 'Member data has been exported to CSV file.');
    } catch (error) {
      showError('Export Failed', 'There was an error exporting the member data. Please try again.');
      console.error('Export error:', error);
    }
  }, [members, showSuccess, showError]);

  // Enhanced import functionality
  const handleImportMembers = React.useCallback(async (fileData: any) => {
    setModalLoading(true);
    try {
      // Simulate import processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate 5% chance of failure
      if (Math.random() < 0.05) {
        throw new Error('Import failed due to invalid file format.');
      }
      
      handleImportMembersSuccess();
      showSuccess('Import Successful', 'Members have been successfully imported from the CSV file.');
    } catch (error) {
      handleModalError(error as Error);
      showError('Import Failed', error instanceof Error ? error.message : 'Failed to import members. Please check your file format.');
    }
  }, [handleImportMembersSuccess, handleModalError, setModalLoading, showSuccess, showError]);

  // Enhanced trainer assignment
  const handleAssignTrainerSubmit = React.useCallback(async (member: any, trainerId: string) => {
    setModalLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 3% chance of failure
      if (Math.random() < 0.03) {
        throw new Error('Trainer assignment failed. Please try again.');
      }
      
      handleAssignTrainerSuccess();
      showSuccess('Trainer Assigned', 'The personal trainer has been successfully assigned to the member.');
    } catch (error) {
      handleModalError(error as Error);
      showError('Assignment Failed', error instanceof Error ? error.message : 'Failed to assign trainer. Please try again.');
    }
  }, [handleAssignTrainerSuccess, handleModalError, setModalLoading, showSuccess, showError]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your gym members and their profiles</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <SmartButton
            variant="secondary"
            size="sm"
            icon={<FiUpload className="w-4 h-4" />}
            onClick={openImportMembersModal}
            className="gap-2"
            disabled={loading || modalLoading}
          >
            Import
          </SmartButton>
          
          <SmartButton
            variant="secondary"
            size="sm"
            icon={<FiDownload className="w-4 h-4" />}
            onClick={handleExport}
            className="gap-2"
            disabled={loading || modalLoading}
          >
            Export
          </SmartButton>
          
          <AddButton 
            label="Add Member" 
            onClick={() => setShowSmartOnboarding(true)}
            disabled={loading || modalLoading}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
              disabled={loading}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>
            
            <FilterButton />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabsNav
        tabs={tabs.map(tab => ({ id: tab.id, label: tab.name, icon: <tab.icon className="w-4 h-4" /> }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Member Table */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Members</h3>
                  <SmartButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('list')}
                    className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
                    disabled={loading}
                  >
                    View All Members
                  </SmartButton>
                </div>
                <SmartMemberTable 
                  members={convertedMembers.slice(0, 5)} // Show only first 5 on dashboard
                  onEdit={handleEditMember}
                  onDelete={handleDeleteMember}
                  onView={(member) => {
                    console.log('Member clicked:', member);
                    setSelectedMemberForDetail(member);
                  }}
                  onAssignTrainer={handleAssignTrainer}
                  loading={loading}
                  currentPage={1}
                  totalPages={1}
                  itemsPerPage={5}
                  onPageChange={() => {}}
                  onItemsPerPageChange={() => {}}
                  totalItems={Math.min(5, totalItems)}
                />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsTab 
                members={members} 
                stats={stats} 
                onFilterMembers={(filter) => {
                  console.log('Filtering members:', filter);
                  // TODO: Implement filtering logic
                  // This would typically update the search/filter state
                  // and trigger a re-render of the member table
                }}
              />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-6">
              <SmartMemberTable 
                members={convertedMembers}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onView={(member) => {
                  console.log('Member clicked:', member);
                  setSelectedMemberForDetail(member);
                }}
                onAssignTrainer={handleAssignTrainer}
                loading={loading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={updateSorting}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={totalItems}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Smart Modals */}
      <SmartMemberOnboardingModal
        isOpen={showSmartOnboarding}
        onClose={() => setShowSmartOnboarding(false)}
        onSuccess={handleAddMember}
      />

      <MemberProfileDrawer
        member={selectedMemberForDetail}
        isOpen={!!selectedMemberForDetail}
        onClose={() => setSelectedMemberForDetail(null)}
        onEdit={handleEditMember}
        onRefresh={() => {
          // Refresh member data if needed
          console.log('Refreshing member data...');
        }}
      />

      {/* Legacy Modals */}
      <EditMemberModal
        isOpen={modalState.editMember}
        onClose={() => closeModal('editMember')}
        member={modalData.selectedMember}
        onSuccess={handleEditMemberSubmit}
        loading={modalLoading}
      />

      <DeleteMemberModal
        isOpen={modalState.deleteMember}
        onClose={() => closeModal('deleteMember')}
        member={modalData.selectedMember}
        onSuccess={handleDeleteMemberSubmit}
        loading={modalLoading}
        modalRef={modalRef}
      />

      <ImportMembersModal
        isOpen={modalState.importMembers}
        onClose={() => closeModal('importMembers')}
        onSuccess={handleImportMembers}
        loading={modalLoading}
        modalRef={modalRef}
      />

      <AssignTrainerModal
        isOpen={modalState.assignTrainer}
        onClose={() => closeModal('assignTrainer')}
        member={modalData.selectedMember}
        onSuccess={handleAssignTrainerSubmit}
        loading={modalLoading}
        modalRef={modalRef}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Members;
