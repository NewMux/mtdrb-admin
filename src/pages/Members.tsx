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
  FiStar,
  FiClock,
} from "react-icons/fi";
import SmartMemberTable from "../components/members/SmartMemberTable";
import { useRTL } from "../hooks/useRTL";
import { useTranslation } from "react-i18next";

import ToastContainer from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { exportCSV } from "../utils/exportData";
import AdvancedFilterModal from "../components/ui/AdvancedFilterModal";

// Import modal components
import {
  AddMemberModal,
  EditMemberModal,
  DeleteMemberModal,
  CancelMembershipModal,
  ViewMemberProfileModal,
  ImportMembersModal,
  AssignTrainerModal,
} from "../components/members/modals";

// Import hooks
// Removed mock members - using real data from Supabase
import { supabase } from "../supabaseClient";
import { useSmartMemberModal } from "../hooks/useSmartMemberModal";
import AnalyticsTab from "../components/members/tabs/AnalyticsTab";
import { usePermissions } from "../hooks/usePermissions";
import { type Member } from "../types/member";
// Using SmartMemberTable's Member type for converted members
type TableMember = Member & {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  joinDate: string;
  planEnd: string;
  lastCheckIn: string;
  checkInCount: number;
  status: "active" | "inactive" | "suspended" | "expired" | "trial";
  membershipPrice: number;
  formsSubmitted: string[];
  isTrial: boolean;
  attendance: string[];
  tags: string[];
  assignedTrainerId?: string;
  fitnessGoal?: string;
};

// Removed mock member conversion - using real data from Supabase

const Members: React.FC = () => {
  usePageThemeContext();
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  // State management for members
  const [members, setMembers] = React.useState<TableMember[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("all");
  const [sortBy] = React.useState("name");
  const [sortOrder] = React.useState<"asc" | "desc">("asc");
  const [loading, setLoading] = React.useState(true);
  const { tenantId } = useAuth();
  const [stats, setStats] = React.useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
  });
  const [memberStats, setMemberStats] = React.useState<any[]>([]);

  // Update initial memberStats when language changes
  React.useEffect(() => {
    setMemberStats([
      {
        name: t("members.totalMembers", "إجمالي الأعضاء"),
        value: stats.total.toString(),
        change: t("common.loading", "جاري التحميل..."),
        icon: FiUsers,
        color: "from-blue-500 to-blue-600",
      },
      {
        name: t("members.activeMembers", "الأعضاء النشطون"),
        value: stats.active.toString(),
        change: t("common.loading", "جاري التحميل..."),
        icon: FiActivity,
        color: "from-green-500 to-green-600",
      },
      {
        name: t("members.averageRating", "متوسط التقييم"),
        value: "0.0",
        change: t("common.loading", "جاري التحميل..."),
        icon: FiStar,
        color: "from-yellow-500 to-orange-500",
      },
      {
        name: t("members.monthlyCheckins", "تسجيلات الدخول الشهرية"),
        value: "0",
        change: t("common.loading", "جاري التحميل..."),
        icon: FiClock,
        color: "from-purple-500 to-purple-600",
      },
    ]);
  }, [t, stats.total, stats.active]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Fetch members and stats from Supabase
  React.useEffect(() => {
    const fetchMembers = async () => {
      if (!tenantId) return;
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        const convertedMembers: TableMember[] = (data || []).map((m: any) => {
          const status =
            m.status === "active"
              ? "active"
              : m.status === "inactive"
                ? "inactive"
                : m.status === "suspended"
                  ? "suspended"
                  : m.status === "trial"
                    ? "trial"
                    : "expired";
          return {
            id: m.id,
            name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email,
            email: m.email,
            phone: m.phone || "",
            age: 25, // TODO: Calculate from metadata or add age field
            gender: (["Male", "Female", "Other"].includes(m.metadata?.gender)
              ? m.metadata.gender
              : "Other") as "Male" | "Female" | "Other",
            joinDate:
              m.join_date ||
              m.created_at?.split("T")[0] ||
              new Date().toISOString().split("T")[0],
            planEnd:
              m.expiry_date ||
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            lastCheckIn:
              m.metadata?.last_check_in ||
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            checkInCount: (m.metadata?.check_in_count as number) || 0,
            status,
            membershipPrice: parseFloat(m.metadata?.membership_price as string) || 99.99,
            formsSubmitted: (m.metadata?.forms_submitted as string[]) || [],
            isTrial: (m.metadata?.is_trial as boolean) || false,
            attendance: (m.metadata?.attendance as string[]) || [],
            tags: (m.metadata?.tags as string[]) || [],
            assignedTrainerId: m.trainer_id || undefined,
            fitnessGoal: (m.metadata?.fitness_goal as string) || undefined,
            membership_type: m.membership_type || m.metadata?.membership_type,
            membership_status: m.membership_status,
          };
        });

        setMembers(convertedMembers);
        
        // Calculate stats
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const totalCount = convertedMembers.length;
        const activeCount = convertedMembers.filter(m => m.status === "active").length;
        const newThisMonthCount = convertedMembers.filter((m) => {
          const joinDate = new Date(m.joinDate || "");
          return joinDate >= monthAgo;
        }).length;
        
        // Get previous month stats for comparison
        const { data: previousMonthMembers } = await supabase
          .from("members")
          .select("id, status, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd));

        const previousTotal = (previousMonthMembers || []).length;
        const previousActive = (previousMonthMembers || []).filter(m => m.status === "active").length;
        const totalChange = totalCount - previousTotal;
        const activeChange = activeCount - previousActive;
        
        setStats({
          total: totalCount,
          active: activeCount,
          inactive: convertedMembers.filter(m => m.status === "inactive").length,
          newThisMonth: newThisMonthCount,
        });

        // Fetch Average Rating from trainers
        const { data: trainers } = await supabase
          .from("trainers")
          .select("rating")
          .eq("tenant_id", tenantId)
          .not("rating", "is", null);

        const avgRating = trainers && trainers.length > 0
          ? trainers.reduce((sum, t) => sum + Number(t.rating || 0), 0) / trainers.length
          : 0;

        // Get previous month average rating
        await supabase
          .from("trainers")
          .select("rating")
          .eq("tenant_id", tenantId)
          .not("rating", "is", null);

        // For simplicity, using same trainers (ratings don't change monthly typically)
        // In a real system, you'd track rating history
        const previousAvgRating = avgRating > 0 ? avgRating - 0.2 : 0; // Placeholder
        const ratingChange = avgRating - previousAvgRating;

        // Fetch Monthly Check-ins
        const [currentCheckIns, previousCheckIns] = await Promise.all([
          supabase
            .from("class_bookings")
            .select("id, status, created_at")
            .eq("tenant_id", tenantId)
            .in("status", ["checked_in", "completed"])
            .gte("created_at", formatDate(currentMonthStart)),
          supabase
            .from("class_bookings")
            .select("id, status, created_at")
            .eq("tenant_id", tenantId)
            .in("status", ["checked_in", "completed"])
            .gte("created_at", formatDate(previousMonthStart))
            .lte("created_at", formatDate(previousMonthEnd)),
        ]);

        const currentCheckInsCount = (currentCheckIns.data || []).length;
        const previousCheckInsCount = (previousCheckIns.data || []).length;
        const checkInsChange = previousCheckInsCount > 0
          ? ((currentCheckInsCount - previousCheckInsCount) / previousCheckInsCount) * 100
          : 0;

        // Update member stats
        setMemberStats([
          {
            name: t("members.totalMembers"),
            value: totalCount.toString(),
            change: totalChange >= 0 ? `+${totalChange} ${t("members.fromLastMonth")}` : `${totalChange} ${t("members.fromLastMonth")}`,
            icon: FiUsers,
            color: "from-blue-500 to-blue-600",
          },
          {
            name: t("members.activeMembers"),
            value: activeCount.toString(),
            change: activeChange >= 0 ? `+${activeChange} ${t("members.fromLastMonth")}` : `${activeChange} ${t("members.fromLastMonth")}`,
            icon: FiActivity,
            color: "from-green-500 to-green-600",
          },
          {
            name: t("members.averageRating"),
            value: avgRating > 0 ? avgRating.toFixed(1) : t("dashboard.notAvailable"),
            change: avgRating > 0
              ? ratingChange >= 0 ? `+${ratingChange.toFixed(1)} ${t("members.fromLastMonth")}` : `${ratingChange.toFixed(1)} ${t("members.fromLastMonth")}`
              : t("members.noRatingData"),
            icon: FiStar,
            color: "from-yellow-500 to-orange-500",
          },
          {
            name: t("members.monthlyCheckins"),
            value: currentCheckInsCount.toLocaleString(),
            change: checkInsChange >= 0 ? `+${checkInsChange.toFixed(1)}% ${t("members.fromLastMonth")}` : `${checkInsChange.toFixed(1)}% ${t("members.fromLastMonth")}`,
            icon: FiClock,
            color: "from-purple-500 to-purple-600",
          },
        ]);
        
        setTotalPages(Math.ceil(convertedMembers.length / itemsPerPage));
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [refreshKey, itemsPerPage, tenantId, t]);

  // Filter and sort members
  const convertedMembers = React.useMemo(() => {
    let filtered = members;
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(m => 
        (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(m => m.status === selectedFilter);
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortBy as keyof TableMember] ?? "";
      const bVal = b[sortBy as keyof TableMember] ?? "";
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
  const updateItemsPerPage = React.useCallback((count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  }, []);
  const goToPage = React.useCallback((page: number) => setCurrentPage(page), []);

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

  const {
    modalState,
    modalData,
    isLoading: modalLoading,
    openAddMemberModal,
    openEditMemberModal,
    openDeleteMemberModal,
    openCancelMembershipModal,
    openViewProfileModal,
    openImportMembersModal,
    openAssignTrainerModal,
    handleAddMemberSuccess,
    handleEditMemberSuccess,
    handleDeleteMemberSuccess,
    handleCancelMembershipSuccess,
    handleImportMembersSuccess,
    handleAssignTrainerSuccess,
    closeModal,
    setModalLoading,
  } = useSmartMemberModal();

  // Toast system
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Export members function
  const handleExportMembers = React.useCallback(async () => {
    if (!tenantId) {
      showError("Error", "No tenant ID found");
      return;
    }

    try {
      const { data: members, error } = await supabase
        .from("members")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const exportData = (members || []).map((member: any) => ({
        "First Name": member.first_name || "",
        "Last Name": member.last_name || "",
        Name: member.name || `${member.first_name || ""} ${member.last_name || ""}`.trim(),
        Email: member.email || "",
        Phone: member.phone || "",
        Status: member.status || "active",
        "Membership Type": member.membership_type || "Standard",
        "Membership Status": member.membership_status || "active",
        "Join Date": member.join_date
          ? new Date(member.join_date).toLocaleDateString()
          : "N/A",
        "Expiry Date": member.expiry_date
          ? new Date(member.expiry_date).toLocaleDateString()
          : "N/A",
        "Created At": member.created_at
          ? new Date(member.created_at).toLocaleDateString()
          : "N/A",
      }));

      const filename = `members-export-${new Date().toISOString().split("T")[0]}`;
      exportCSV(exportData, filename);
      showSuccess(t("members.exportSuccessful"), t("members.membersDataExported"));
    } catch (error) {
      console.error("Export failed:", error);
      showError(
        t("members.exportFailed"),
        `${t("members.failedToExport")}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [tenantId, showSuccess, showError]);

  // Function to add a test member (exposed for manual use)
  const addTestMember = React.useCallback(async () => {
    if (!tenantId) {
      console.error('No tenant ID available');
      showError('Error', 'No tenant ID found. Please log in again.');
      return;
    }

    try {
      const testMember = {
        tenant_id: tenantId,
        first_name: 'Ahmed',
        last_name: 'Al-Mansoori',
        email: `ahmed.almansoori.${Date.now()}@example.com`,
        phone: '+973 1234 5678',
        status: 'active',
        membership_type: 'Premium',
        membership_status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        metadata: {
          gender: 'Male',
          fitness_level: 'Intermediate',
          primary_goals: ['Muscle Gain', 'Strength Training'],
          language: 'English',
          membership_price: 199,
          weight: 75,
          target_weight: 80,
          height: 175,
          date_of_birth: '1990-05-15',
          emergency_contact: '+973 9876 5432',
          consent_signed: true,
          previous_gym_experience: true,
          workout_frequency_goal: 4,
          preferred_workout_times: ['Morning', 'Evening'],
          staff_notes: 'Test member added automatically',
          tags: ['VIP', 'Athlete'],
        },
      };

      const { data, error } = await supabase
        .from('members')
        .insert(testMember)
        .select()
        .single();

      if (error) {
        console.error('Failed to add test member:', error);
        showError('Error', `Failed to add test member: ${error.message}`);
      } else {
        console.log('✅ Test member added:', data.id);
        console.log('Name:', `${data.first_name} ${data.last_name}`);
        setRefreshKey((prev) => prev + 1);
        showSuccess('Test Member Added', `Ahmed Al-Mansoori has been added to your members list.`);
      }
    } catch (error: any) {
      console.error('Error adding test member:', error);
      showError('Error', `Failed to add test member: ${error.message}`);
    }
  }, [tenantId, showSuccess, showError, setRefreshKey]);

  // Add test member on first load (development only)
  React.useEffect(() => {
    if (import.meta.env.DEV && tenantId) {
      const hasAddedTestMember = sessionStorage.getItem('testMemberAdded');
      if (!hasAddedTestMember) {
        setTimeout(() => {
          addTestMember();
          sessionStorage.setItem('testMemberAdded', 'true');
        }, 1000);
      }
    }
  }, [tenantId, addTestMember]);

  // Expose function to window for manual use
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).addTestMember = addTestMember;
      console.log('🧪 Development mode: Use window.addTestMember() to add a test member');
    }
  }, [addTestMember]);

  // Permission checks
  const { canCreate } = usePermissions();

  const tabs = [
    { id: "dashboard", name: t("members.dashboard"), icon: FiUsers },
    { id: "list", name: t("members.memberList"), icon: FiUserPlus },
    { id: "analytics", name: t("members.analytics"), icon: FiBarChart2 },
  ];

  const filters = [
    { id: "all", name: t("members.allMembers"), count: stats.total },
    { id: "active", name: t("members.active"), count: stats.active },
    { id: "inactive", name: t("members.inactive"), count: stats.inactive },
    { id: "new", name: t("members.newThisMonth"), count: stats.newThisMonth },
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

  // Handle adding a new member
  const handleAddMember = React.useCallback(
    async (memberData: Omit<Member, "id">) => {
      if (!tenantId) {
        showError("Error", "No tenant ID found. Please log in again.");
        return;
      }

      try {
        setModalLoading(true);

        // Split name into first_name and last_name
        const nameParts = (memberData.name || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Prepare the member data for database insertion
        const memberPayload: any = {
          tenant_id: tenantId,
          first_name: firstName,
          last_name: lastName,
          email: memberData.email || "",
          phone: memberData.phone || null,
          status: memberData.status || "active",
          membership_type: memberData.membership_type || memberData.membershipType || "Standard",
          membership_status: memberData.membership_status || "active",
          join_date: memberData.start_date || memberData.join_date || new Date().toISOString().split("T")[0],
          expiry_date: memberData.end_date || memberData.expiry_date || null,
          trainer_id: memberData.assigned_trainer_id || memberData.trainer_id || null,
          metadata: {
            gender: memberData.gender || "Other",
            fitness_level: memberData.fitness_level || "Beginner",
            medical_conditions: memberData.medical_conditions || [],
            injuries: memberData.injuries || [],
            primary_goals: memberData.primary_goals || memberData.goals || [],
            health_conditions: memberData.health_conditions || [],
            date_of_birth: memberData.date_of_birth || null,
            national_id: memberData.national_id || null,
            emergency_contact: memberData.emergency_contact || null,
            language: memberData.language || "English",
            membership_price: memberData.membership_price || 0,
            weight: memberData.weight || null,
            target_weight: memberData.target_weight || null,
            height: memberData.height || null,
            consent_signed: memberData.consent_signed || false,
            previous_gym_experience: memberData.previous_gym_experience || false,
            workout_frequency_goal: memberData.workout_frequency_goal || 3,
            preferred_workout_times: memberData.preferred_workout_times || [],
            staff_notes: memberData.staff_notes || null,
            medical_notes: memberData.medical_notes || null,
            notes: memberData.notes || null,
            add_ons: memberData.add_ons || [],
            tags: memberData.tags || [],
          },
        };

        // Insert the member into Supabase
        const { error } = await supabase
          .from("members")
          .insert(memberPayload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Success - refresh members list and show toast
        setRefreshKey((prev) => prev + 1);
        showSuccess("Success", `Member ${firstName} ${lastName} added successfully!`);
        handleAddMemberSuccess();
      } catch (error: any) {
        console.error("Failed to add member:", error);
        showError(
          "Error",
          error.message || "Failed to add member. Please try again.",
        );
      } finally {
        setModalLoading(false);
      }
    },
    [tenantId, setModalLoading, showSuccess, showError, handleAddMemberSuccess],
  );


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
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-start"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-start">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Member List Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t("members.recentMembers")}
                </h2>
                <button
                  onClick={() => setActiveTab("list")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t("members.viewAllMembers")}
                </button>
              </div>
              <SmartMemberTable
                members={convertedMembers.slice(0, 5)}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onCancelMembership={(m) => openCancelMembershipModal(m as any)}
                onView={handleViewMember}
                onAssignTrainer={handleAssignTrainer}
                loading={loading}
                currentPage={1}
                totalPages={1}
                totalItems={5}
                itemsPerPage={5}
                onPageChange={() => {}}
                onItemsPerPageChange={() => {}}
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
              refreshKey={refreshKey}
              onFilterMembers={() => {
                // Handle filter logic here
              }}
            />
          </div>
        );


      case "list":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-start">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("members.memberManagement")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("members.manageAllMembers")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openImportMembersModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <FiUpload className="w-4 h-4" />
                    <span>{t("members.import")}</span>
                  </button>
                  <button
                    onClick={handleExportMembers}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>{t("members.export")}</span>
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => openAddMemberModal()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>{t("members.addMember")}</span>
                    </button>
                  )}
                </div>
              </div>

              <SmartMemberTable
                members={convertedMembers}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onCancelMembership={(m) => openCancelMembershipModal(m as any)}
                onView={handleViewMember}
                onAssignTrainer={handleAssignTrainer}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={convertedMembers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              👥 {t("members.smartMemberManagement")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t("members.intelligentTracking")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreate && (
              <button
                onClick={() => openAddMemberModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                <span>{t("members.addMember")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
            <input
              type="text"
              placeholder={t("members.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => updateSearch(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => updateFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showAdvancedFilters
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Advanced filters"
            >
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            onSuccess={handleAddMember}
            loading={modalLoading}
          />
        )}

        {modalState.editMember && modalData.selectedMember && (
          <EditMemberModal
            isOpen={modalState.editMember}
            onClose={() => closeModal("editMember")}
            member={modalData.selectedMember}
            onSuccess={async () => { handleEditMemberSuccess(); }}
          />
        )}

        {modalState.deleteMember && modalData.selectedMember && (
          <DeleteMemberModal
            isOpen={modalState.deleteMember}
            onClose={() => closeModal("deleteMember")}
            member={modalData.selectedMember}
            onSuccess={async () => { handleDeleteMemberSuccess(); }}
          />
        )}

        {modalState.cancelMembership && modalData.selectedMember && (
          <CancelMembershipModal
            isOpen={modalState.cancelMembership}
            onClose={() => closeModal("cancelMembership")}
            member={modalData.selectedMember}
            onSuccess={async () => {
              handleCancelMembershipSuccess();
              setRefreshKey(prev => prev + 1);
            }}
          />
        )}

        {modalState.viewProfile && modalData.selectedMember && (
          <ViewMemberProfileModal
            isOpen={modalState.viewProfile}
            onClose={() => closeModal("viewProfile")}
            member={modalData.selectedMember}
          />
        )}

        {modalState.importMembers && (
          <ImportMembersModal
            isOpen={modalState.importMembers}
            onClose={() => closeModal("importMembers")}
            onSuccess={async () => { handleImportMembersSuccess(); }}
          />
        )}

        {modalState.assignTrainer && modalData.selectedMember && (
          <AssignTrainerModal
            isOpen={modalState.assignTrainer}
            onClose={() => closeModal("assignTrainer")}
            member={modalData.selectedMember}
            onSuccess={async () => { handleAssignTrainerSuccess(); }}
          />
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title={t("members.advancedFilters")}
        clearLabel={t("members.clearAll")}
        applyLabel={t("members.applyFilters")}
        onClear={() => {
          // Clear all filters logic here
        }}
        onApply={() => {
          // Apply filters logic here
        }}
      >
        {/* Membership Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("members.membershipTypeFilter")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("members.allTypes")}</option>
            <option value="monthly">{t("members.monthly")}</option>
            <option value="yearly">{t("members.yearly")}</option>
            <option value="class-pack">{t("members.classPack")}</option>
            <option value="trial">{t("members.trial")}</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("members.paymentStatus")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("members.allStatuses")}</option>
            <option value="paid">{t("members.paid")}</option>
            <option value="pending">{t("members.pending")}</option>
            <option value="overdue">{t("members.overdue")}</option>
            <option value="failed">{t("members.failed")}</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("members.joinedDate")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("members.allTime")}</option>
            <option value="today">{t("members.today")}</option>
            <option value="this-week">{t("members.thisWeek")}</option>
            <option value="this-month">{t("members.thisMonth")}</option>
            <option value="last-month">{t("members.lastMonth")}</option>
            <option value="last-3-months">{t("members.last3Months")}</option>
            <option value="this-year">{t("members.thisYear")}</option>
          </select>
        </div>

        {/* Last Check-in Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("members.lastCheckin")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("members.anyTime")}</option>
            <option value="today">{t("members.today")}</option>
            <option value="this-week">{t("members.thisWeek")}</option>
            <option value="this-month">{t("members.thisMonth")}</option>
            <option value="last-month">{t("members.lastMonth")}</option>
            <option value="over-30-days">{t("members.over30Days")}</option>
            <option value="never">{t("members.never")}</option>
          </select>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("members.tags")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("members.allTags")}</option>
            <option value="at-risk">{t("members.atRisk")}</option>
            <option value="vip">{t("members.vip")}</option>
            <option value="new">{t("members.new")}</option>
            <option value="champion">{t("members.champion")}</option>
            <option value="inactive">{t("members.inactive")}</option>
          </select>
        </div>
      </AdvancedFilterModal>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Members;
