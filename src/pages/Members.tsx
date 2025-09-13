import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUsers,
  FiUserPlus,
  FiActivity,
  FiBarChart2,
  FiUpload,
  FiTrendingUp,
  FiStar,
  FiClock,
} from "react-icons/fi";
import SmartMemberTable from "../components/members/SmartMemberTable";

import MemberProfileDrawer from "../components/members/MemberProfileDrawer";
import FilterButton from "../components/ui/FilterButton";
import TabsNav from "../components/ui/TabsNav";
import { AddButton } from "../components/ui/AddButton";
import { SmartButton } from "../components/ui/DesignSystem";
import ToastContainer from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { usePageThemeContext } from "../contexts/PageThemeContext";

// Import modal components
import {
  AddMemberModal,
  EditMemberModal,
  DeleteMemberModal,
  ViewMemberProfileModal,
  ImportMembersModal,
  AssignTrainerModal,
} from "../components/members/modals";

// Import hooks
import { useMockMembers, MockMember } from "../hooks/useMockMembers";
import { useSmartMemberModal } from "../hooks/useSmartMemberModal";
import MemberModal from "../components/members/MemberModal";
import AnalyticsTab from "../components/members/tabs/AnalyticsTab";

// Type adapter to convert MockMember to Member
const convertMockMemberToMember = (mockMember: MockMember) => ({
  id: mockMember.id,
  name: mockMember.name,
  email: mockMember.email,
  phone: mockMember.phone,
  age: 25,
  gender: mockMember.gender || "other",
  joinDate: mockMember.joinDate,
  planEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  lastCheckIn:
    mockMember.lastVisit === "Never"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      : mockMember.lastVisit,
  checkInCount: Math.floor(Math.random() * 50) + 1,
  status:
    mockMember.status === "active"
      ? "active"
      : mockMember.status === "inactive"
        ? "inactive"
        : ("expired" as const),
  membershipPrice: 99.99,
  formsSubmitted: ["waiver"],
  isTrial: false,
  attendance: [
    mockMember.lastVisit === "Never"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      : mockMember.lastVisit,
  ],
  tags: mockMember.status === "active" ? ["active"] : ["inactive"],
  assignedTrainerId: mockMember.trainer_id,
  fitnessGoal: mockMember.goals?.[0] || "general_fitness",
});

const Members: React.FC = () => {
  const { theme } = usePageThemeContext();
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Use custom hooks for data and modal management
  const {
    members,
    searchTerm,
    updateSearch,
    selectedFilter,
    updateFilter,
    sortBy,
    sortOrder,
    updateSorting,
    loading,
    stats,
    addMember,
    editMember,
    deleteMember,
    currentPage,
    totalPages,
    itemsPerPage,
    updateItemsPerPage,
    goToPage,
  } = useMockMembers();

  // Convert MockMembers to Members for SmartMemberTable
  const convertedMembers = React.useMemo(
    () => members.map(convertMockMemberToMember),
    [members],
  );

  // Pagination handlers
  const handlePageChange = React.useCallback(
    (page: number) => {
      goToPage(page);
    },
    [goToPage],
  );

  const handleItemsPerPageChange = React.useCallback(
    (newItemsPerPage: number) => {
      updateItemsPerPage(newItemsPerPage);
    },
    [updateItemsPerPage],
  );

  const totalItems = React.useMemo(() => {
    return stats.total;
  }, [stats.total]);

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
    handleModalError,
  } = useSmartMemberModal();

  // Toast system
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: FiUsers },
    { id: "list", name: "Member List", icon: FiUserPlus },
    { id: "analytics", name: "Analytics", icon: FiBarChart2 },
  ];

  const filters = [
    { id: "all", name: "All Members", count: stats.total },
    { id: "active", name: "Active", count: stats.active },
    { id: "inactive", name: "Inactive", count: stats.inactive },
    { id: "new", name: "New This Month", count: stats.newThisMonth },
  ];

  const memberStats = [
    {
      name: "Total Members",
      value: stats.total.toString(),
      change: "+12 from last month",
      icon: FiUsers,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Active Members",
      value: stats.active.toString(),
      change: "+8 from last month",
      icon: FiActivity,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Average Rating",
      value: "4.8",
      change: "+0.2 from last month",
      icon: FiStar,
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: "Monthly Check-ins",
      value: "1,247",
      change: "+15% from last month",
      icon: FiClock,
      color: "from-purple-500 to-purple-600",
    },
  ];

  // Enhanced member action handlers
  const handleEditMember = React.useCallback(
    (member: any) => {
      try {
        const originalMember = members.find((m) => m.id === member.id);
        if (originalMember) {
          openEditMemberModal(originalMember);
        }
      } catch (error) {
        showError("Error", "Failed to open edit modal. Please try again.");
      }
    },
    [openEditMemberModal, showError, members],
  );

  const handleDeleteMember = React.useCallback(
    (member: any) => {
      try {
        const originalMember = members.find((m) => m.id === member.id);
        if (originalMember) {
          openDeleteMemberModal(originalMember);
        }
      } catch (error) {
        showError("Error", "Failed to open delete modal. Please try again.");
      }
    },
    [openDeleteMemberModal, showError, members],
  );

  const handleViewMember = React.useCallback(
    (member: any) => {
      try {
        const originalMember = members.find((m) => m.id === member.id);
        if (originalMember) {
          openViewProfileModal(originalMember);
        }
      } catch (error) {
        showError("Error", "Failed to open profile modal. Please try again.");
      }
    },
    [openViewProfileModal, showError, members],
  );

  const handleAssignTrainer = React.useCallback(
    (member: any) => {
      try {
        const originalMember = members.find((m) => m.id === member.id);
        if (originalMember) {
          openAssignTrainerModal(originalMember);
        }
      } catch (error) {
        showError(
          "Error",
          "Failed to open trainer assignment modal. Please try again.",
        );
      }
    },
    [openAssignTrainerModal, showError, members],
  );


  const [selectedMemberForDetail, setSelectedMemberForDetail] =
    React.useState<any>(null);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {memberStats.map((stat, index) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Member List Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Members
                </h2>
                <button
                  onClick={() => setActiveTab("list")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View All Members
                </button>
              </div>
              <SmartMemberTable
                members={convertedMembers.slice(0, 5)}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onView={handleViewMember}
                onAssign={handleAssignTrainer}
                loading={loading}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  totalItems: 5,
                  itemsPerPage: 5,
                  onPageChange: () => {},
                  onItemsPerPageChange: () => {},
                }}
              />
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <AnalyticsTab
              members={convertedMembers}
              stats={stats}
              onFilterMembers={(filter) => {
                // Handle filter logic here
                console.log("Filter applied:", filter);
              }}
            />
          </div>
        );

      case "list":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Member Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage all members, profiles, and memberships
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => openImportMembersModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <FiUpload className="w-4 h-4" />
                    <span>Import</span>
                  </button>
                  <button
                    onClick={() => openAddMemberModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>

              <SmartMemberTable
                members={convertedMembers}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onView={handleViewMember}
                onAssign={handleAssignTrainer}
                loading={loading}
                pagination={{
                  currentPage,
                  totalPages,
                  totalItems,
                  itemsPerPage,
                  onPageChange: handlePageChange,
                  onItemsPerPageChange: handleItemsPerPageChange,
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              👥 Smart Member Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Intelligent tracking • Automated onboarding • Zero paperwork
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => openAddMemberModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => updateSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => updateFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {modalState.addMember && (
          <AddMemberModal
            isOpen={modalState.addMember}
            onClose={() => closeModal("addMember")}
            onSuccess={handleAddMemberSuccess}
          />
        )}

        {modalState.editMember && modalData.selectedMember && (
          <EditMemberModal
            isOpen={modalState.editMember}
            onClose={() => closeModal("editMember")}
            member={modalData.selectedMember}
            onSuccess={handleEditMemberSuccess}
          />
        )}

        {modalState.deleteMember && modalData.selectedMember && (
          <DeleteMemberModal
            isOpen={modalState.deleteMember}
            onClose={() => closeModal("deleteMember")}
            member={modalData.selectedMember}
            onSuccess={handleDeleteMemberSuccess}
          />
        )}

        {modalState.viewProfile && modalData.selectedMember && (
          <ViewMemberProfileModal
            isOpen={modalState.viewProfile}
            onClose={() => closeModal("viewProfile")}
            member={modalData.selectedMember}
            onSuccess={handleViewMember}
          />
        )}

        {modalState.importMembers && (
          <ImportMembersModal
            isOpen={modalState.importMembers}
            onClose={() => closeModal("importMembers")}
            onSuccess={handleImportMembersSuccess}
          />
        )}

        {modalState.assignTrainer && modalData.selectedMember && (
          <AssignTrainerModal
            isOpen={modalState.assignTrainer}
            onClose={() => closeModal("assignTrainer")}
            member={modalData.selectedMember}
            onSuccess={handleAssignTrainerSuccess}
          />
        )}
      </AnimatePresence>



      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Members;
