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
import type { Database, Json } from "../types/supabase";
import { PageHeader } from "../components/ui/PageHeader";
import { StatStrip } from "../components/ui/StatStrip";
import { fetchAllRows } from "../utils/fetchAllRows";
import { monthBoundary } from "../utils/periodBoundaries";
import { toLocalDateString } from "../utils/analyticsRange";
import { countMembersActiveAsOf } from "../utils/memberActivity";
import { useGymConfig } from "../contexts/gym-config-context";

// Raw "members" table row as returned by Supabase (select("*"))
type MemberRow = Database["public"]["Tables"]["members"]["Row"];

// Shape of the application-specific data stored in members.metadata (jsonb)
interface MemberRowMetadata {
  gender?: string;
  age?: number;
  last_check_in?: string;
  check_in_count?: number;
  membership_price?: number | string;
  forms_submitted?: string[];
  is_trial?: boolean;
  attendance?: string[];
  tags?: string[];
  fitness_goal?: string;
  membership_type?: string;
}

// Using SmartMemberTable's Member type for converted members
type TableMember = Member & {
  id: string;
  name: string;
  phone: string;
  age?: number;
  gender: "Male" | "Female" | "Other";
  joinDate: string;
  /** "" = no expiry date recorded. */
  planEnd: string;
  /** "" = no check-in recorded. */
  lastCheckIn: string;
  checkInCount: number;
  status: "active" | "inactive" | "suspended" | "expired" | "trial";
  membershipPrice?: number;
  formsSubmitted: string[];
  isTrial: boolean;
  attendance: string[];
  tags: string[];
  assignedTrainerId?: string;
  fitnessGoal?: string;
};

// Payload shape built for inserting a new row into the "members" table
interface NewMemberPayload {
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  membership_type: string;
  membership_status: string;
  join_date: string;
  expiry_date: string | null;
  trainer_id: string | null;
  metadata: Record<string, unknown>;
}

interface StatCard {
  name: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// Removed mock member conversion - using real data from Supabase

const Members: React.FC = () => {
  const { config: gymConfig } = useGymConfig();
  const timezone = gymConfig.timezone;
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
  const [memberStats, setMemberStats] = React.useState<StatCard[]>([]);

  // Update initial memberStats when language changes
  React.useEffect(() => {
    setMemberStats([
      {
        name: t("members.totalMembers", "إجمالي الأعضاء"),
        value: stats.total.toString(),
        change: t("common.loading", "جاري التحميل..."),
        icon: FiUsers,
        color: "bg-blue-500",
      },
      {
        name: t("members.activeMembers", "الأعضاء النشطون"),
        value: stats.active.toString(),
        change: t("common.loading", "جاري التحميل..."),
        icon: FiActivity,
        color: "bg-green-500",
      },
      {
        name: t("members.averageRating", "متوسط التقييم"),
        value: "0.0",
        change: t("common.loading", "جاري التحميل..."),
        icon: FiStar,
        color: "bg-yellow-500",
      },
      {
        name: t("members.monthlyCheckins", "تسجيلات الدخول الشهرية"),
        value: "0",
        change: t("common.loading", "جاري التحميل..."),
        icon: FiClock,
        color: "bg-purple-500",
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
        
        // Paged: one PostgREST response stops at 1000 rows, which would silently
        // cut a big gym's member list (and every count below) short.
        const data = await fetchAllRows((from, to) =>
          supabase
            .from("members")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .order("id", { ascending: true })
            .range(from, to),
        );

        const convertedMembers: TableMember[] = (data || []).map((m: MemberRow) => {
          const metadata = (m.metadata as MemberRowMetadata | undefined) ?? {};
          const rawStatus = String(m.status);
          const status =
            rawStatus === "active"
              ? "active"
              : rawStatus === "inactive"
                ? "inactive"
                : rawStatus === "suspended"
                  ? "suspended"
                  : rawStatus === "trial"
                    ? "trial"
                    : "expired";
          return {
            id: m.id,
            name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.email,
            email: m.email,
            phone: m.phone || "",
            // Missing data stays missing. These used to be filled with made-up values
            // (age 18, a plan ending in a year, a visit 30 days ago, a 99.99 price) that
            // then showed up as facts and drove the status and "expires in N days" logic.
            age: metadata.age,
            gender: (["Male", "Female", "Other"].includes(metadata.gender ?? "")
              ? metadata.gender
              : "Other") as "Male" | "Female" | "Other",
            joinDate:
              m.join_date ||
              (m.created_at ? toLocalDateString(new Date(m.created_at)) : "") ||
              toLocalDateString(new Date()),
            planEnd: m.expiry_date || "", // "" = no expiry date recorded
            lastCheckIn: metadata.last_check_in || "", // "" = no check-in recorded
            checkInCount: metadata.check_in_count || 0,
            status,
            membershipPrice: parseFloat(String(metadata.membership_price ?? "")) || undefined,
            formsSubmitted: metadata.forms_submitted || [],
            isTrial: metadata.is_trial || false,
            attendance: metadata.attendance || [],
            tags: metadata.tags || [],
            assignedTrainerId: m.trainer_id || undefined,
            fitnessGoal: metadata.fitness_goal || undefined,
            membership_type: m.membership_type || metadata.membership_type,
            membership_status: m.membership_status as Member["membership_status"],
          };
        });

        setMembers(convertedMembers);
        
        // Calculate stats
        // Months in the gym's timezone as full instants with an exclusive upper
        // bound (see periodBoundaries.ts); a bare date string would drop the last
        // day of every range.
        const now = new Date();
        const currentMonth = monthBoundary(now, 0, timezone);
        const previousMonth = monthBoundary(now, 1, timezone);
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const totalCount = convertedMembers.length;
        const activeCount = convertedMembers.filter(m => m.status === "active").length;
        const newThisMonthCount = convertedMembers.filter((m) => {
          const joinDate = new Date(m.joinDate || "");
          return joinDate >= monthAgo;
        }).length;
        
        // Compare with where the gym stood at the END of last month, worked out
        // from the members already loaded (join/expiry dates). The old code
        // compared today's totals with the members who JOINED last month, a much
        // smaller group, so the change was nonsense.
        const previousMonthEnd = new Date(Date.parse(previousMonth.endExclusiveISO) - 1);
        const previousTotal = data.filter((m: MemberRow) => {
          const joined = new Date(m.join_date || m.created_at || "");
          return !Number.isNaN(joined.getTime()) && joined <= previousMonthEnd;
        }).length;
        const previousActive = countMembersActiveAsOf(data, previousMonthEnd);
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

        // Ratings are stored as a single current value per trainer, so there is no
        // last-month figure to compare with. (This used to show avgRating - 0.2, an
        // invented improvement.)

        // Fetch Monthly Check-ins
        const checkInsIn = (period: { startISO: string; endExclusiveISO: string }) =>
          supabase
            .from("class_bookings")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .in("status", ["checked_in", "completed"])
            .gte("created_at", period.startISO)
            .lt("created_at", period.endExclusiveISO);
        const [currentCheckIns, previousCheckIns] = await Promise.all([
          checkInsIn(currentMonth),
          checkInsIn(previousMonth),
        ]);

        const currentCheckInsCount = currentCheckIns.count ?? 0;
        const previousCheckInsCount = previousCheckIns.count ?? 0;
        // No check-ins last month means there is nothing to compare, not "+0%".
        const checkInsChange = previousCheckInsCount > 0
          ? ((currentCheckInsCount - previousCheckInsCount) / previousCheckInsCount) * 100
          : null;

        // Update member stats
        setMemberStats([
          {
            name: t("members.totalMembers"),
            value: totalCount.toString(),
            change: totalChange >= 0 ? `+${totalChange} ${t("members.fromLastMonth")}` : `${totalChange} ${t("members.fromLastMonth")}`,
            icon: FiUsers,
            color: "bg-blue-500",
          },
          {
            name: t("members.activeMembers"),
            value: activeCount.toString(),
            change: activeChange >= 0 ? `+${activeChange} ${t("members.fromLastMonth")}` : `${activeChange} ${t("members.fromLastMonth")}`,
            icon: FiActivity,
            color: "bg-green-500",
          },
          {
            name: t("members.averageRating"),
            value: avgRating > 0 ? avgRating.toFixed(1) : t("dashboard.notAvailable"),
            change: avgRating > 0 ? t("members.acrossAllTrainers") : t("members.noRatingData"),
            icon: FiStar,
            color: "bg-yellow-500",
          },
          {
            name: t("members.monthlyCheckins"),
            value: currentCheckInsCount.toLocaleString(),
            change: checkInsChange === null
              ? t("dashboard.noComparison")
              : checkInsChange >= 0 ? `+${checkInsChange.toFixed(1)}% ${t("members.fromLastMonth")}` : `${checkInsChange.toFixed(1)}% ${t("members.fromLastMonth")}`,
            icon: FiClock,
            color: "bg-purple-500",
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
  }, [refreshKey, itemsPerPage, tenantId, t, timezone]);

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

      const exportData = (members || []).map((member: MemberRow) => ({
        "First Name": member.first_name || "",
        "Last Name": member.last_name || "",
        Name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
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

      const filename = `members-export-${toLocalDateString(new Date())}`;
      exportCSV(exportData, filename);
      showSuccess(t("members.exportSuccessful"), t("members.membersDataExported"));
    } catch (error) {
      console.error("Export failed:", error);
      showError(
        t("members.exportFailed"),
        `${t("members.failedToExport")}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [tenantId, showSuccess, showError, t]);

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
        join_date: toLocalDateString(new Date()),
        expiry_date: toLocalDateString(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
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
        // Development-only helper (the only caller is gated on import.meta.env.DEV).
        // eslint-disable-next-line no-console
        console.info('Test member added:', data.id);
        setRefreshKey((prev) => prev + 1);
        showSuccess('Test Member Added', `Ahmed Al-Mansoori has been added to your members list.`);
      }
    } catch (error: unknown) {
      console.error('Error adding test member:', error);
      const message = error instanceof Error ? error.message : String(error);
      showError('Error', `Failed to add test member: ${message}`);
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
      (window as Window & { addTestMember?: () => Promise<void> }).addTestMember =
        addTestMember;
      // eslint-disable-next-line no-console -- development only (import.meta.env.DEV)
      console.info('Development mode: use window.addTestMember() to add a test member');
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
    (member: { id: string }) => {
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
    (member: { id: string }) => {
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
    (member: { id: string }) => {
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
    (member: { id: string }) => {
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

  const handleCancelMembership = React.useCallback(
    (member: { id: string }) => {
      try {
        const originalMember = members.find((m) => m.id === member.id);
        if (originalMember) {
          openCancelMembershipModal(originalMember);
        }
      } catch (error) {
        showError(
          "Error",
          "Failed to open cancel membership modal. Please try again.",
        );
      }
    },
    [openCancelMembershipModal, showError, members],
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
        const memberPayload: NewMemberPayload = {
          tenant_id: tenantId,
          first_name: firstName,
          last_name: lastName,
          email: memberData.email || "",
          phone: memberData.phone || null,
          status: memberData.status || "active",
          membership_type: memberData.membership_type || memberData.membershipType || "Standard",
          membership_status: memberData.membership_status || "active",
          join_date: memberData.start_date || memberData.join_date || toLocalDateString(new Date()),
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
          .insert(memberPayload as Database["public"]["Tables"]["members"]["Insert"])
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Success - refresh members list and show toast
        setRefreshKey((prev) => prev + 1);
        showSuccess("Success", `Member ${firstName} ${lastName} added successfully!`);
        handleAddMemberSuccess();
      } catch (error: unknown) {
        console.error("Failed to add member:", error);
        const message = error instanceof Error ? error.message : undefined;
        showError(
          "Error",
          message || "Failed to add member. Please try again.",
        );
      } finally {
        setModalLoading(false);
      }
    },
    [tenantId, setModalLoading, showSuccess, showError, handleAddMemberSuccess],
  );

  // Handle saving an edited member (persists EditMemberModal's form data)
  const handleSaveEditedMember = React.useCallback(
    async (memberId: string, memberData: Partial<Member>) => {
      try {
        setModalLoading(true);

        // Fetch current metadata so we only overwrite the fields this form edits
        const { data: existing, error: fetchError } = await supabase
          .from("members")
          .select("metadata")
          .eq("id", memberId)
          .single();

        if (fetchError) throw fetchError;

        const existingMetadata = (existing?.metadata as Record<string, Json>) || {};

        const nameParts = (memberData.name || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const updatedMetadata: Record<string, Json> = {
          ...existingMetadata,
          gender: memberData.gender ?? existingMetadata.gender ?? null,
          fitness_goal: memberData.fitnessGoal ?? existingMetadata.fitness_goal ?? null,
          injuries: (memberData.injuries as Json | undefined) ?? existingMetadata.injuries ?? null,
          staff_notes: memberData.staffNotes ?? existingMetadata.staff_notes ?? null,
          age: memberData.age ?? existingMetadata.age ?? null,
        };

        const updatePayload: Database["public"]["Tables"]["members"]["Update"] = {
          first_name: firstName || undefined,
          last_name: lastName,
          email: memberData.email || undefined,
          phone: memberData.phone || undefined,
          metadata: updatedMetadata,
        };

        const { error } = await supabase
          .from("members")
          .update(updatePayload)
          .eq("id", memberId);

        if (error) throw error;

        setRefreshKey((prev) => prev + 1);
        showSuccess("Success", "Member updated successfully!");
        handleEditMemberSuccess();
      } catch (error: unknown) {
        console.error("Failed to update member:", error);
        const message = error instanceof Error ? error.message : undefined;
        showError("Error", message || "Failed to update member. Please try again.");
      } finally {
        setModalLoading(false);
      }
    },
    [setModalLoading, showSuccess, showError, handleEditMemberSuccess],
  );

  // Handle confirming a member deletion
  const handleConfirmDeleteMember = React.useCallback(
    async (member: Member) => {
      if (!member.id) return;

      try {
        setModalLoading(true);

        const { error } = await supabase
          .from("members")
          .delete()
          .eq("id", member.id);

        if (error) throw error;

        setRefreshKey((prev) => prev + 1);
        showSuccess("Success", `${member.name || "Member"} deleted successfully!`);
        handleDeleteMemberSuccess();
      } catch (error: unknown) {
        console.error("Failed to delete member:", error);
        const message = error instanceof Error ? error.message : undefined;
        showError("Error", message || "Failed to delete member. Please try again.");
      } finally {
        setModalLoading(false);
      }
    },
    [setModalLoading, showSuccess, showError, handleDeleteMemberSuccess],
  );

  // Handle saving a trainer assignment (or removal, when trainerId is "") for a member
  const handleSaveAssignTrainer = React.useCallback(
    async (member: Member, trainerId: string) => {
      if (!member.id) return;

      try {
        setModalLoading(true);

        const { error } = await supabase
          .from("members")
          .update({ trainer_id: trainerId || null })
          .eq("id", member.id);

        if (error) throw error;

        setRefreshKey((prev) => prev + 1);
        showSuccess(
          "Success",
          trainerId
            ? `Trainer assigned to ${member.name || "member"} successfully!`
            : `Trainer removed from ${member.name || "member"}.`,
        );
        handleAssignTrainerSuccess();
      } catch (error: unknown) {
        console.error("Failed to assign trainer:", error);
        const message = error instanceof Error ? error.message : undefined;
        showError("Error", message || "Failed to assign trainer. Please try again.");
      } finally {
        setModalLoading(false);
      }
    },
    [setModalLoading, showSuccess, showError, handleAssignTrainerSuccess],
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Summary */}
            <StatStrip
              items={memberStats.map((stat) => ({ label: stat.name, value: stat.value, detail: stat.change }))}
            />

            {/* Member List Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-6`}>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
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
                onCancelMembership={handleCancelMembership}
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
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-start">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {t("members.memberManagement")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("members.manageAllMembers")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openImportMembersModal()}
                    className="btn btn-secondary"
                  >
                    <FiUpload className="w-4 h-4" />
                    <span>{t("members.import")}</span>
                  </button>
                  <button
                    onClick={handleExportMembers}
                    className="btn btn-secondary"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>{t("members.export")}</span>
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => openAddMemberModal()}
                      className="btn btn-primary"
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
                onCancelMembership={handleCancelMembership}
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
      <PageHeader
        title={t("members.smartMemberManagement")}
        subtitle={t("members.intelligentTracking")}
        actions={
          <>
            {canCreate && (
              <button
                onClick={() => openAddMemberModal()}
                className="btn btn-primary"
              >
                <FiPlus className="w-4 h-4" />
                <span>{t("members.addMember")}</span>
              </button>
            )}
          </>
        }
      />

      {/* Search and Filters */}
      <div>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
            <input
              type="text"
              placeholder={t("members.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => updateSearch(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => updateFilter(e.target.value)}
              className="ps-4 pe-9 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
      <div role="tablist" className="mac-segmented max-w-full overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`mac-segment whitespace-nowrap ${
              activeTab === tab.id ? "mac-segment-active" : "hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
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
            onSuccess={handleSaveEditedMember}
          />
        )}

        {modalState.deleteMember && modalData.selectedMember && (
          <DeleteMemberModal
            isOpen={modalState.deleteMember}
            onClose={() => closeModal("deleteMember")}
            member={modalData.selectedMember}
            onSuccess={handleConfirmDeleteMember}
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
            onSuccess={handleSaveAssignTrainer}
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
          <select className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
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
          <select className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
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
          <select className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
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
          <select className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
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
          <select className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
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
