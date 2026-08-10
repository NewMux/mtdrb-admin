import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { Class } from "../types";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useRTL } from "../hooks/useRTL";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiTarget,
  FiCheckCircle,
  FiSettings,
} from "react-icons/fi";
import ClassTable from "../components/classes/ClassTable";
import ClassDetailsDrawer from "../components/classes/ClassDetailsDrawer";
import ClassCalendar from "../components/classes/ClassCalendar";

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
  getSmartInsights,
} from "../api/automation";
import {
  getAllClasses,
  getClassStats,
  getClassAnalytics,
} from "../api/class";

import ClassAnalyticsTab from "../components/classes/tabs/ClassAnalyticsTab";
import AdvancedFilterModal from "../components/ui/AdvancedFilterModal";

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

export default function SmartClassManagement() {
  const { isRTL } = useRTL();
  usePageThemeContext();
  const { t } = useTranslation();

  type ClassRow = Class & {
    bookings?: Array<{ count: number }>;
    startTime?: string;
  };

  // Core State
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const { user } = useAuth();
  useSubscription();

  // View State
  const [activeView, setActiveView] = useState<
    "dashboard" | "insights" | "analytics" | "management" | "calendar" | "automation"
  >("dashboard");

  // Modal & Drawer State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedClass, setSelectedClass] = useState<ClassRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Analytics & Insights State
  const [classStats, setClassStats] = useState<ClassStats>({
    totalClasses: 0,
    totalCapacity: 0,
    bookedSpots: 0,
    upcomingClasses: 0,
    revenue: 0,
    utilization: 0,
  });

  const [, setClassAnalytics] = useState<LocalClassAnalytics>({
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


  const classStatsData = [
    {
      name: t("classes.totalClasses"),
      value: classStats.totalClasses.toString(),
      change: `+5 ${t("classes.fromLastWeek")}`,
      icon: FiCalendar,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: t("classes.totalCapacity"),
      value: classStats.totalCapacity.toString(),
      change: `+12% ${t("classes.fromLastWeek")}`,
      icon: FiUsers,
      color: "from-green-500 to-green-600",
    },
    {
      name: t("classes.bookedSpots"),
      value: classStats.bookedSpots.toString(),
      change: `+8% ${t("classes.fromLastWeek")}`,
      icon: FiCheckCircle,
      color: "from-purple-500 to-purple-600",
    },
    {
      name: t("classes.revenue"),
      value: `$${classStats.revenue.toLocaleString()}`,
      change: `+15% ${t("classes.fromLastWeek")}`,
      icon: FiDollarSign,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const tabs = [
    { id: "dashboard", name: t("classes.dashboard"), icon: FiActivity },
    { id: "calendar", name: t("classes.calendar"), icon: FiCalendar },
    { id: "management", name: t("classes.classManagement"), icon: FiSettings },
  ];

  const filters = [
    { id: "all", name: t("classes.allClasses"), count: classes.length },
    {
      id: "upcoming",
      name: t("classes.upcoming"),
      count: classes.filter((c) => {
        const start = c.start_time ?? c.startTime ?? "";
        return start ? new Date(start) > new Date() : false;
      }).length,
    },
    {
      id: "popular",
      name: t("classes.popular"),
      count: classes.filter((c) => (c.bookings?.length ?? 0) > 10).length,
    },
    {
      id: "underbooked",
      name: t("classes.underbooked"),
      count: classes.filter((c) => (c.bookings?.length ?? 0) < 5).length,
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
      // Get tenantId from user metadata or memberships
      const tenantId = user?.user_metadata?.tenant_id || user?.user_metadata?.tenantId;
      if (!tenantId) {
        setSmartInsights({
          criticalAlerts: [],
          opportunities: [],
          trends: [],
          automationSuggestions: [],
        });
        return;
      }
      await getSmartInsights(tenantId);
      // getSmartInsights returns an array, but we need to transform it to match SmartInsights structure
      // For now, just set empty structure since insights are optional
      setSmartInsights({
        criticalAlerts: [],
        opportunities: [],
        trends: [],
        automationSuggestions: [],
      });
    } catch (error) {
      console.error("Error fetching smart insights:", error);
      setSmartInsights({
        criticalAlerts: [],
        opportunities: [],
        trends: [],
        automationSuggestions: [],
      });
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
      ]);
    };

    initializeData();
  }, []);

  // Modal handlers
  const handleAddClass = () => {
    setActiveModal("add");
  };

  const handleEditClass = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("edit");
  };

  const handleDeleteClass = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("delete");
  };

  const handleViewClass = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("view");
  };

  const handleScheduleClass = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("schedule");
  };

  const handleAssignTrainer = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("assign");
  };

  const handleWaitlist = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("waitlist");
  };

  const handleCancelClass = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("cancel");
  };

  const handleExportClass = (classItem: ClassRow) => {
    setSelectedClass(classItem);
    setActiveModal("export");
  };

  const handleSettings = (classItem: ClassRow) => {
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

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedClass(null);
  };

  const handleRefresh = () => {
    fetchAllClasses();
    fetchClassStats();
    toast.success(t("classes.dataRefreshed"));
  };

  const handleExport = () => {
    // Export functionality
    toast.success(t("classes.exportCompleted"));
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

            {/* Critical Alerts */}
            {smartInsights.criticalAlerts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🚨 {t("classes.criticalAlerts")}
                </h3>
                <div className="space-y-3">
                  {smartInsights?.criticalAlerts?.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <FiTarget className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-300 text-start">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-start">
                  {t("classes.recentClasses")}
                </h2>
                <button
                  onClick={() => setActiveView("management")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t("classes.viewAllClasses")}
                </button>
              </div>
              <ClassTable
                classes={classes.slice(0, 5)}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
                onView={handleViewClass}
                onSchedule={handleScheduleClass}
                onAssignTrainer={handleAssignTrainer}
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
            <ClassAnalyticsTab classes={classes} />
          </div>
        );



      case "management":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-start">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("classes.classManagement")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("classes.manageAllClasses")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>{t("classes.export")}</span>
                  </button>
                  <button
                    onClick={handleAddClass}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>{t("classes.addClass")}</span>
                  </button>
                </div>
              </div>

              <ClassTable
                classes={classes}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
                onView={handleViewClass}
                onSchedule={handleScheduleClass}
                onAssignTrainer={handleAssignTrainer}
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
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📅 {t("classes.smartClassManagement")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t("classes.intelligentScheduling")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>{t("classes.refresh")}</span>
            </button>
            <button
              onClick={handleAddClass}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>{t("classes.addClass")}</span>
            </button>
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
              placeholder={t("classes.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
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
              aria-label={t("classes.advancedFilters")}
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
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === tab.id
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

        {activeModal === "schedule" && selectedClass && (
          <ScheduleClassModal
            isOpen={activeModal === "schedule"}
            onClose={closeModal}
            classId={selectedClass.id}
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

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title={t("classes.advancedFilters")}
        clearLabel={t("classes.clearFilters")}
        onClear={() => {
          setSelectedFilter("all");
        }}
      >
        {/* Class Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Class Type
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">All Types</option>
            <option value="yoga">Yoga</option>
            <option value="pilates">Pilates</option>
            <option value="hiit">HIIT</option>
            <option value="strength">Strength Training</option>
            <option value="cardio">Cardio</option>
            <option value="spinning">Spinning</option>
            <option value="zumba">Zumba</option>
            <option value="boxing">Boxing</option>
          </select>
        </div>

        {/* Trainer Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trainer
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">All Trainers</option>
            {/* TODO: Populate with actual trainers */}
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("classes.dateRange") || "Date Range"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              placeholder={t("classes.from")}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <input
              type="date"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              placeholder={t("classes.to")}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        </div>

        {/* Capacity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("classes.capacity")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("classes.anyCapacity")}</option>
            <option value="underbooked">{t("classes.underbookedLess50")}</option>
            <option value="full">{t("classes.full100")}</option>
            <option value="available">{t("classes.hasSpotsAvailable")}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("classes.status")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("classes.allStatuses")}</option>
            <option value="active">{t("classes.active")}</option>
            <option value="scheduled">{t("classes.scheduled")}</option>
            <option value="completed">{t("classes.completed")}</option>
            <option value="cancelled">{t("classes.cancelled")}</option>
          </select>
        </div>
      </AdvancedFilterModal>

      {/* Drawer */}
      {selectedClass && (
        <ClassDetailsDrawer
          classData={selectedClass}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onEdit={handleEditClass}
          onWaitlist={handleWaitlist}
        />
      )}
    </div>
  );
}
