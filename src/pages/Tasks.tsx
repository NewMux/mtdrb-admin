import * as React from "react";
import { m as motion } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiCheckSquare,
  FiBarChart2,
} from "react-icons/fi";
import { useRTL } from "../hooks/useRTL";
import { useTranslation } from "react-i18next";
import TaskTable from "../components/tasks/TaskTable";
import TabFallback from "../components/ui/TabFallback";
// Charts load when the analytics tab is first opened.
const SmartTaskAnalytics = React.lazy(() => import("../components/tasks/SmartTaskAnalytics"));
import { AnimatePresence } from "framer-motion";
import AddButton from "../components/ui/AddButton";
import { AddTaskModal } from "../components/tasks/modals/AddTaskModal";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { supabase } from "../supabaseClient";
import AdvancedFilterModal from "../components/ui/AdvancedFilterModal";
import { PageHeader } from "../components/ui/PageHeader";
import { StatStrip } from "../components/ui/StatStrip";

const Tasks: React.FC = () => {
  usePageThemeContext();
  const { tenantId } = useAuth();
  const { isPro } = useSubscription();
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("all");
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [taskStats, setTaskStats] = React.useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const tabs = React.useMemo(() => [
    { id: "overview", name: t("tasks.overview"), icon: FiCheckSquare },
    { id: "analytics", name: t("tasks.analytics"), icon: FiBarChart2 },
  ], [t]);

  const [filters, setFilters] = React.useState([
    { id: "all", name: t("tasks.allTasks"), count: 0 },
    { id: "pending", name: t("tasks.pending"), count: 0 },
    { id: "in-progress", name: t("tasks.inProgress"), count: 0 },
    { id: "completed", name: t("tasks.completed"), count: 0 },
  ]);

  // Update filter names when language changes
  React.useEffect(() => {
    setFilters(prev => prev.map(filter => ({
      ...filter,
      name: filter.id === "all" ? t("tasks.allTasks") :
            filter.id === "pending" ? t("tasks.pending") :
            filter.id === "in-progress" ? t("tasks.inProgress") :
            filter.id === "completed" ? t("tasks.completed") : filter.name
    })));
  }, [t]);

  // Fetch task statistics
  React.useEffect(() => {
    const fetchTaskStats = async () => {
      if (!tenantId) return;
      
      try {
        setIsLoading(true);
        
        // Try to fetch from the tasks table
        let taskData = null;
        let taskError = null;

        try {
          const result = await supabase
            .from("tasks")
            .select("id, status, due_date")
            .eq("tenant_id", tenantId);
          taskData = result.data;
          taskError = result.error;
        } catch (err: unknown) {
          // Table might not exist
          const errObj = err && typeof err === "object" ? (err as Record<string, unknown>) : {};
          const errCode = typeof errObj.code === "string" ? errObj.code : undefined;
          const errMessage = typeof errObj.message === "string" ? errObj.message : undefined;
          if (errCode === "PGRST116" || errMessage?.includes("relation") || errMessage?.includes("does not exist")) {
            console.warn("tasks table does not exist");
            setTaskStats({ total: 0, pending: 0, inProgress: 0, completed: 0 });
            setFilters([
              { id: "all", name: t("tasks.allTasks"), count: 0 },
              { id: "pending", name: t("tasks.pending"), count: 0 },
              { id: "in-progress", name: t("tasks.inProgress"), count: 0 },
              { id: "completed", name: t("tasks.completed"), count: 0 },
            ]);
            setIsLoading(false);
            return;
          }
          throw err;
        }

        if (taskError && taskError.code !== "PGRST116") {
          // Handle UUID errors gracefully
          if (taskError.message?.includes("invalid input syntax for type uuid") || taskError.message?.includes("uuid")) {
            console.warn("Invalid tenant ID format, using empty stats");
            setTaskStats({ total: 0, pending: 0, inProgress: 0, completed: 0 });
            setFilters([
              { id: "all", name: t("tasks.allTasks"), count: 0 },
              { id: "pending", name: t("tasks.pending"), count: 0 },
              { id: "in-progress", name: t("tasks.inProgress"), count: 0 },
              { id: "completed", name: t("tasks.completed"), count: 0 },
            ]);
            setIsLoading(false);
            return;
          }
          throw taskError;
        }

        const tasks = taskData || [];
        const total = tasks.length;
        const pending = tasks.filter(t => t.status === "pending").length;
        const inProgress = tasks.filter(t => t.status === "in_progress").length;
        const completed = tasks.filter(t => t.status === "completed").length;

        setTaskStats({ total, pending, inProgress, completed });
        setFilters([
          { id: "all", name: t("tasks.allTasks"), count: total },
          { id: "pending", name: t("tasks.pending"), count: pending },
          { id: "in-progress", name: t("tasks.inProgress"), count: inProgress },
          { id: "completed", name: t("tasks.completed"), count: completed },
        ]);

      } catch (error) {
        console.error("Error fetching task stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskStats();
  }, [tenantId, refreshKey, t]);

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleTaskSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setShowAddTaskModal(false);
  };


  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <PageHeader
        title={t("tasks.title")}
        subtitle={t("tasks.subtitle")}
        actions={<AddButton label={t("tasks.addTask")} onClick={handleAddTask} />}
      />

      {/* Search and Filters */}
      <div>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4`} />
            <input
              type="text"
              placeholder={t("tasks.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`form-input ${isRTL ? 'pr-10 text-right' : 'pl-10 text-left'}`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              aria-label={t("common.filter")}
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="form-select"
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
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Task Stats */}
              <StatStrip
                items={[
                  { label: t("tasks.totalTasks"), value: isLoading ? "..." : taskStats.total },
                  { label: t("tasks.pending"), value: isLoading ? "..." : taskStats.pending },
                  { label: t("tasks.inProgress"), value: isLoading ? "..." : taskStats.inProgress },
                  { label: t("tasks.completed"), value: isLoading ? "..." : taskStats.completed },
                ]}
              />

              {/* Task Table */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white text-start">
                    {t("tasks.recentTasks")}
                  </h3>
                  <button className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium transition-colors">
                    {t("tasks.viewAllTasks")}
                  </button>
                </div>
                <div className="mt-4">
                  <TaskTable refreshKey={refreshKey} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <React.Suspense fallback={<TabFallback />}>
                <SmartTaskAnalytics refreshKey={refreshKey} />
              </React.Suspense>
            </div>
          )}



        </motion.div>
      </AnimatePresence>

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title={t("tasks.advancedFilters")}
        clearLabel={t("tasks.clearAllFilters")}
        onClear={() => {
          setSelectedFilter("all");
        }}
      >
        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("tasks.priority")}
          </label>
          <select className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("tasks.allPriorities")}</option>
            <option value="low">{t("tasks.low")}</option>
            <option value="medium">{t("tasks.medium")}</option>
            <option value="high">{t("tasks.high")}</option>
            <option value="urgent">{t("tasks.urgent")}</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("tasks.assignee")}
          </label>
          <select className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("tasks.allAssignees")}</option>
            <option value="unassigned">{t("tasks.unassigned")}</option>
            <option value="me">{t("tasks.assignedToMe")}</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("tasks.dueDateFrom")}
          </label>
          <input
            type="date"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("tasks.dueDateTo")}
          </label>
          <input
            type="date"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("tasks.status")}
          </label>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full ps-4 pe-9 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <option value="all">{t("tasks.allStatuses")}</option>
            <option value="pending">{t("tasks.pending")}</option>
            <option value="in-progress">{t("tasks.inProgress")}</option>
            <option value="completed">{t("tasks.completed")}</option>
            <option value="cancelled">{t("tasks.cancelled")}</option>
          </select>
        </div>
      </AdvancedFilterModal>

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSuccess={handleTaskSuccess}
        isPro={isPro}
      />
    </div>
  );
};

export default Tasks;
