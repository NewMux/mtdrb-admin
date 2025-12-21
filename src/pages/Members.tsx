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
  FiX,
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
// Removed mock members - using real data from Supabase
import { supabase } from "../supabaseClient";
import { useSmartMemberModal } from "../hooks/useSmartMemberModal";
import MemberModal from "../components/members/MemberModal";
import AnalyticsTab from "../components/members/tabs/AnalyticsTab";
import { usePermissions } from "../hooks/usePermissions";

// Removed mock member conversion - using real data from Supabase

const Members: React.FC = () => {
  const { theme } = usePageThemeContext();
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const filterPanelRef = React.useRef<HTMLDivElement>(null);

  // Close filter panel when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node) &&
        showAdvancedFilters
      ) {
        setShowAdvancedFilters(false);
      }
    };

    if (showAdvancedFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAdvancedFilters]);

  // State management for members
  const [members, setMembers] = React.useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Fetch members from Supabase
  React.useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let tenantId = user.user_metadata?.tenant_id;
        if (!tenantId) {
          const { data: membershipData } = await supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();
          tenantId = membershipData?.tenant_id;
        }

        if (tenantId) {
          const { data, error } = await supabase
            .from("members")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false });

          if (error) throw error;
          
          const convertedMembers: Member[] = (data || []).map((m: any) => ({
            id: m.id,
            name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
            email: m.email,
            phone: m.phone || "",
            age: 25, // TODO: Calculate from metadata or add age field
            gender: (m.metadata?.gender as any) || "other",
            joinDate: m.join_date || m.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
            planEnd: m.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            lastCheckIn: m.metadata?.last_check_in || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            checkInCount: (m.metadata?.check_in_count as number) || 0,
            status: m.status === "active" ? "active" : m.status === "inactive" ? "inactive" : ("expired" as const),
            membershipPrice: parseFloat(m.metadata?.membership_price as string) || 99.99,
            formsSubmitted: (m.metadata?.forms_submitted as string[]) || [],
            isTrial: (m.metadata?.is_trial as boolean) || false,
            attendance: (m.metadata?.attendance as string[]) || [],
            tags: (m.metadata?.tags as string[]) || [],
            assignedTrainerId: m.trainer_id || "",
            fitnessGoal: (m.metadata?.fitness_goal as string) || "general_fitness",
          }));

          setMembers(convertedMembers);
          
          // Calculate stats
          const now = new Date();
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          
          setStats({
            total: convertedMembers.length,
            active: convertedMembers.filter(m => m.status === "active").length,
            inactive: convertedMembers.filter(m => m.status === "inactive").length,
            newThisMonth: convertedMembers.filter(m => {
              const joinDate = new Date(m.joinDate);
              return joinDate >= monthAgo;
            }).length,
          });
          
          setTotalPages(Math.ceil(convertedMembers.length / itemsPerPage));
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [refreshKey, itemsPerPage]);

  // Filter and sort members
  const convertedMembers = React.useMemo(() => {
    let filtered = members;
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(m => m.status === selectedFilter);
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortBy as keyof Member];
      const bVal = b[sortBy as keyof Member];
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    
    // Apply pagination
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [members, searchTerm, selectedFilter, sortBy, sortOrder, currentPage, itemsPerPage]);

  const updateSearch = React.useCallback((term: string) => setSearchTerm(term), []);
  const updateFilter = React.useCallback((filter: string) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  }, []);
  const updateSorting = React.useCallback((field: string, order: "asc" | "desc") => {
    setSortBy(field);
    setSortOrder(order);
  }, []);
  const updateItemsPerPage = React.useCallback((count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  }, []);
  const goToPage = React.useCallback((page: number) => setCurrentPage(page), []);
  
  const addMember = React.useCallback(() => {}, []);
  const editMember = React.useCallback(() => {}, []);
  const deleteMember = React.useCallback(() => {}, []);

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

  // Permission checks
  const { canCreate, canEdit, canDelete, isManager } = usePermissions();

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
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Members
                </h2>
                <button
                  onClick={() => setActiveTab("list")}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
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
              }}
            />
          </div>
        );

      case "list":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Member Management
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage all members, profiles, and memberships
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => openImportMembersModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <FiUpload className="w-4 h-4" />
                    <span>Import</span>
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => openAddMemberModal()}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  )}
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              👥 Smart Member Management
            </h1>
            <p className="text-gray-600 mt-1">
              Intelligent tracking • Automated onboarding • Zero paperwork
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {canCreate && (
              <button
                onClick={() => openAddMemberModal()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => updateSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => updateFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <div className="relative" ref={filterPanelRef}>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showAdvancedFilters
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="Advanced filters"
              >
                <FiFilter className="w-4 h-4" />
              </button>

              {/* Advanced Filter Panel */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-4"
                  >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Advanced Filters
                      </h3>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Membership Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Membership Type
                      </label>
                      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">All Types</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="class-pack">Class Pack</option>
                        <option value="trial">Trial</option>
                      </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Status
                      </label>
                      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Joined Date
                      </label>
                      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="last-3-months">Last 3 Months</option>
                        <option value="this-year">This Year</option>
                      </select>
                    </div>

                    {/* Last Check-in Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Check-in
                      </label>
                      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Any Time</option>
                        <option value="today">Today</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="over-30-days">Over 30 Days Ago</option>
                        <option value="never">Never</option>
                      </select>
                    </div>

                    {/* Tags Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">All Tags</option>
                        <option value="at-risk">At Risk</option>
                        <option value="vip">VIP</option>
                        <option value="new">New</option>
                        <option value="champion">Champion</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
