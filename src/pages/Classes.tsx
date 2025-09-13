import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { Class } from "../types";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import {
  FiPlus,
  FiCalendar,
  FiClock,
  FiUsers,
  FiUser,
  FiMapPin,
  FiDollarSign,
  FiActivity,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
  FiEdit,
  FiMoreVertical,
  FiCpu,
  FiZap,
  FiHeart,
  FiCreditCard,
  FiMail,
  FiMessageSquare,
  FiTarget,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiTrash2,
  FiEye,
  FiSettings,
  FiStar,
  FiSend,
} from "react-icons/fi";
import ClassTable from "../components/classes/ClassTable";
import ClassKPICards from "../components/classes/ClassKPICards";
import SmartClassFormModal from "../components/classes/SmartClassFormModal";
import ClassDetailsDrawer from "../components/classes/ClassDetailsDrawer";
import ClassFormModal from "../components/classes/ClassFormModal";
import WaitlistModal from "../components/classes/WaitlistModal";
import ClassCalendar from "../components/classes/ClassCalendar";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Import smart class modals
import {
  AddClassModal,
  EditClassModal,
  DeleteClassModal,
  ScheduleClassModal,
  CancelClassModal,
  ProcessWaitlistModal,
  AssignTrainerModal,
  ViewClassDetailsModal,
  ExportClassDataModal,
  UpdateClassSettingsModal,
  SendClassPromotionModal,
} from "../components/classes/modals";

import {
  getClassWaitlist,
  addToWaitlist,
  removeFromWaitlist,
  promoteFromWaitlist,
} from "../api/waitlist";
import { getAllMembers } from "../api/member";
import {
  getSmartInsights,
  getClassCategories,
  getClassAnalytics as getAutomationClassAnalytics,
  initializeAutomationData,
  SmartInsight,
  ClassCategory,
  ClassAnalytics,
} from "../api/automation";
import {
  getAllClasses,
  getClassStats,
  getClassAnalytics,
  getClassesWithBookings,
  createClass,
  updateClass,
  deleteClass,
  ClassStats as ApiClassStats,
  ClassAnalyticsData,
} from "../api/class";
import {
  mockClasses,
  mockBookings,
  mockTrainers,
  mockMembers,
} from "../api/mockClassData";
import SmartClassAnalytics from "../components/classes/SmartClassAnalytics";

import ClassAnalyticsTab from "../components/classes/tabs/ClassAnalyticsTab";

type ModalType =
  | "add"
  | "edit"
  | "delete"
  | "view"
  | "schedule"
  | "assign"
  | "waitlist"
  | "cancel"
  | "export"
  | "settings"
  | "sendPromotion"
  | null;

interface ClassStats {
  totalClasses: number;
  totalCapacity: number;
  bookedSpots: number;
  upcomingClasses: number;
  revenue: number;
  utilization: number;
}

interface LocalClassAnalytics {
  popularTimes: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  classTypes: {
    strength: number;
    cardio: number;
    yoga: number;
    other: number;
  };
  classRating: {
    average: number;
    totalReviews: number;
  };
  weeklyTrends: Array<{
    week: string;
    totalClasses: number;
    attendance: number;
  }>;
  capacityStats: {
    thisWeek: number;
    totalCapacity: number;
  };
  revenueGrowth: number;
}

interface SmartInsights {
  criticalAlerts: Array<{
    type: string;
    title: string;
    action: string;
    impact: string;
  }>;
  opportunities: Array<{
    type: string;
    title: string;
    action: string;
    potential: string;
  }>;
  trends: any[];
  automationSuggestions: Array<{
    type: string;
    title: string;
    description: string;
    timeSaved: string;
  }>;
}

interface ClassCategories {
  popular: string[];
  underbooked: string[];
  waitlisted: string[];
  high_rated: string[];
}

interface AutomationSettings {
  capacityAlerts: boolean;
  waitlistNotifications: boolean;
  scheduleOptimization: boolean;
  bookingReminders?: boolean;
}

export default function SmartClassManagement() {
  const { theme } = usePageThemeContext();

  // Core State
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isPro } = useSubscription();

  // View State
  const [activeView, setActiveView] = useState<
    "dashboard" | "insights" | "analytics" | "management" | "calendar"
  >("dashboard");

  // Modal & Drawer State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [selectedWaitlistClass, setSelectedWaitlistClass] =
    useState<Class | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Analytics & Insights State
  const [classStats, setClassStats] = useState<ClassStats>({
    totalClasses: 0,
    totalCapacity: 0,
    bookedSpots: 0,
    upcomingClasses: 0,
    revenue: 0,
    utilization: 0,
  });

  const [classAnalytics, setClassAnalytics] = useState<LocalClassAnalytics>({
    popularTimes: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    classTypes: { strength: 0, cardio: 0, yoga: 0, other: 0 },
    classRating: { average: 0, totalReviews: 0 },
    weeklyTrends: [],
    capacityStats: { thisWeek: 0, totalCapacity: 0 },
    revenueGrowth: 0,
  });

  const [smartInsights, setSmartInsights] = useState<SmartInsights>({
    criticalAlerts: [],
    opportunities: [],
    trends: [],
    automationSuggestions: [],
  });


  const [classCategories, setClassCategories] = useState<ClassCategories>({
    popular: [],
    underbooked: [],
    waitlisted: [],
    high_rated: [],
  });

  const [automationSettings, setAutomationSettings] =
    useState<AutomationSettings>({
      capacityAlerts: true,
      waitlistNotifications: true,
      scheduleOptimization: true,
      bookingReminders: true,
    });

  const classStatsData = [
    {
      name: "Total Classes",
      value: classStats.totalClasses.toString(),
      change: "+5 from last week",
      icon: FiCalendar,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Total Capacity",
      value: classStats.totalCapacity.toString(),
      change: "+12% from last week",
      icon: FiUsers,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Booked Spots",
      value: classStats.bookedSpots.toString(),
      change: "+8% from last week",
      icon: FiCheckCircle,
      color: "from-purple-500 to-purple-600",
    },
    {
      name: "Revenue",
      value: `$${classStats.revenue.toLocaleString()}`,
      change: "+15% from last week",
      icon: FiDollarSign,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: FiActivity },
    { id: "calendar", name: "Calendar", icon: FiCalendar },
    { id: "analytics", name: "Analytics", icon: FiBarChart2 },
    { id: "management", name: "Management", icon: FiSettings },
  ];

  const filters = [
    { id: "all", name: "All Classes", count: classes.length },
    {
      id: "upcoming",
      name: "Upcoming",
      count: classes.filter((c) => new Date(c.startTime) > new Date()).length,
    },
    {
      id: "popular",
      name: "Popular",
      count: classes.filter((c) => c.bookings && c.bookings.length > 10).length,
    },
    {
      id: "underbooked",
      name: "Underbooked",
      count: classes.filter((c) => c.bookings && c.bookings.length < 5).length,
    },
  ];

  // Data fetching functions
  const fetchAllClasses = async () => {
    try {
      setLoading(true);
      const fetchedClasses = await getAllClasses();
      setClasses(fetchedClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStats = async () => {
    try {
      const stats = await getClassStats();
      setClassStats(stats);
    } catch (error) {
      console.error("Error fetching class stats:", error);
    }
  };

  const fetchClassAnalytics = async () => {
    try {
      const analytics = await getClassAnalytics();
      setClassAnalytics(analytics);
    } catch (error) {
      console.error("Error fetching class analytics:", error);
    }
  };

  const fetchSmartInsights = async () => {
    try {
      const insights = await getSmartInsights();
      setSmartInsights(insights);
    } catch (error) {
      console.error("Error fetching smart insights:", error);
    }
  };

  const fetchAutomationData = async () => {
    try {
      const categories = await getClassCategories();
      setClassCategories(categories);
    } catch (error) {
      console.error("Error fetching automation data:", error);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchAllClasses(),
        fetchClassStats(),
        fetchClassAnalytics(),
        fetchSmartInsights(),
        fetchAutomationData(),
      ]);
    };

    initializeData();
  }, []);

  // Modal handlers
  const handleAddClass = () => {
    setActiveModal("add");
  };

  const handleEditClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("edit");
  };

  const handleDeleteClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("delete");
  };

  const handleViewClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("view");
  };

  const handleScheduleClass = (classItem?: Class) => {
    if (classItem) setSelectedClass(classItem);
    setActiveModal("schedule");
  };

  const handleAssignTrainer = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("assign");
  };

  const handleWaitlist = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("waitlist");
  };

  const handleCancelClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("cancel");
  };

  const handleExportClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("export");
  };

  const handleSettings = (classItem: Class) => {
    setSelectedClass(classItem);
    setActiveModal("settings");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedClass(null);
  };

  const handleClassModalSuccess = () => {
    closeModal();
    fetchAllClasses();
    fetchClassStats();
    toast.success("Class operation completed successfully!");
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClass) return;

    try {
      await deleteClass(selectedClass.id);
      handleClassModalSuccess();
    } catch (error) {
      toast.error("Failed to delete class");
    }
  };

  const handleRowClick = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedClass(null);
  };

  const handleRefresh = () => {
    fetchAllClasses();
    fetchClassStats();
    toast.success("Data refreshed!");
  };

  const handleExport = () => {
    // Export functionality
    toast.success("Export completed!");
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {classStatsData.map((stat, index) => (
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

            {/* Critical Alerts */}
            {smartInsights.criticalAlerts.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🚨 Critical Alerts
                </h3>
                <div className="space-y-3">
                  {smartInsights.criticalAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center space-x-3">
                        <FiTarget className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          {alert.title}
                        </span>
                      </div>
                      <button className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                        {alert.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Classes */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Classes
                </h2>
                <button
                  onClick={() => setActiveView("management")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View All Classes
                </button>
              </div>
              <ClassTable
                classes={classes.slice(0, 5)}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
                onView={handleViewClass}
                onSchedule={handleScheduleClass}
                onAssign={handleAssignTrainer}
                onWaitlist={handleWaitlist}
                onCancel={handleCancelClass}
                onExport={handleExportClass}
                onSettings={handleSettings}
                loading={loading}
              />
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <ClassAnalyticsTab classes={classes} stats={classStats} />
          </div>
        );



      case "management":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Class Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage all classes, schedules, and bookings
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={handleAddClass}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Class</span>
                  </button>
                </div>
              </div>

              <ClassTable
                classes={classes}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
                onView={handleViewClass}
                onSchedule={handleScheduleClass}
                onAssign={handleAssignTrainer}
                onWaitlist={handleWaitlist}
                onCancel={handleCancelClass}
                onExport={handleExportClass}
                onSettings={handleSettings}
                loading={loading}
              />
            </div>
          </div>
        );

      case "calendar":
        return (
          <div className="h-[calc(100vh-300px)]">
            <ClassCalendar />
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
              📅 Smart Class Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Intelligent scheduling • Automated bookings • Zero conflicts
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleAddClass}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Class</span>
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
              placeholder="Search classes by name, trainer, or time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
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
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === tab.id
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
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveView()}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === "add" && (
          <AddClassModal
            isOpen={activeModal === "add"}
            onClose={closeModal}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "edit" && selectedClass && (
          <EditClassModal
            isOpen={activeModal === "edit"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "delete" && selectedClass && (
          <DeleteClassModal
            isOpen={activeModal === "delete"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "view" && selectedClass && (
          <ViewClassDetailsModal
            isOpen={activeModal === "view"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "schedule" && (
          <ScheduleClassModal
            isOpen={activeModal === "schedule"}
            onClose={closeModal}
            classItem={selectedClass}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "assign" && selectedClass && (
          <AssignTrainerModal
            isOpen={activeModal === "assign"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "waitlist" && selectedClass && (
          <ProcessWaitlistModal
            isOpen={activeModal === "waitlist"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "cancel" && selectedClass && (
          <CancelClassModal
            isOpen={activeModal === "cancel"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "export" && selectedClass && (
          <ExportClassDataModal
            isOpen={activeModal === "export"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "settings" && selectedClass && (
          <UpdateClassSettingsModal
            isOpen={activeModal === "settings"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}

        {activeModal === "sendPromotion" && selectedClass && (
          <SendClassPromotionModal
            isOpen={activeModal === "sendPromotion"}
            onClose={closeModal}
            classId={selectedClass.id}
            onSuccess={handleClassModalSuccess}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      {selectedClass && (
        <ClassDetailsDrawer
          classItem={selectedClass}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onEdit={handleEditClass}
          onDelete={handleDeleteClass}
          onSchedule={handleScheduleClass}
          onAssign={handleAssignTrainer}
          onWaitlist={handleWaitlist}
          onCancel={handleCancelClass}
          onExport={handleExportClass}
          onSettings={handleSettings}
        />
      )}
    </div>
  );
}
