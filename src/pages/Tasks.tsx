import * as React from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiCheckSquare,
  FiClock,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import TaskTable from "../components/tasks/TaskTable";
import SmartTaskAnalytics from "../components/tasks/SmartTaskAnalytics";
import TaskAutomationEngine from "../components/tasks/TaskAutomationEngine";
import { AnimatePresence } from "framer-motion";
import FilterButton from "../components/ui/FilterButton";
import TabsNav from "../components/ui/TabsNav";
import AddButton from "../components/ui/AddButton";
import { SmartButton } from "../components/ui/DesignSystem";
import { AddTaskModal } from "../components/tasks/modals/AddTaskModal";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";

const Tasks: React.FC = () => {
  const { theme } = usePageThemeContext();
  const { tenantId } = useAuth();

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
  const [scheduleStats, setScheduleStats] = React.useState({
    dueToday: 0,
    dueThisWeek: 0,
    overdue: 0,
  });

  const tabs = [
    { id: "overview", name: "Overview", icon: FiCheckSquare },
    { id: "analytics", name: "Analytics", icon: FiBarChart2 },
    { id: "schedule", name: "Schedule", icon: FiClock },
  ];

  const [filters, setFilters] = React.useState([
    { id: "all", name: "All Tasks", count: 0 },
    { id: "pending", name: "Pending", count: 0 },
    { id: "in-progress", name: "In Progress", count: 0 },
    { id: "completed", name: "Completed", count: 0 },
  ]);

  // Fetch task statistics
  React.useEffect(() => {
    const fetchTaskStats = async () => {
      if (!tenantId) return;
      
      try {
        setIsLoading(true);
        
        // Try to fetch from member_tasks table
        let taskData = null;
        let taskError = null;
        
        try {
          const result = await supabase
            .from("member_tasks")
            .select("id, status, due_date")
            .eq("tenant_id", tenantId);
          taskData = result.data;
          taskError = result.error;
        } catch (err: any) {
          // Table might not exist
          if (err?.code === "PGRST116" || err?.message?.includes("relation") || err?.message?.includes("does not exist")) {
            console.warn("member_tasks table does not exist");
            setTaskStats({ total: 0, pending: 0, inProgress: 0, completed: 0 });
            setFilters([
              { id: "all", name: "All Tasks", count: 0 },
              { id: "pending", name: "Pending", count: 0 },
              { id: "in-progress", name: "In Progress", count: 0 },
              { id: "completed", name: "Completed", count: 0 },
            ]);
            setIsLoading(false);
            return;
          }
          throw err;
        }

        if (taskError && taskError.code !== "PGRST116") {
          throw taskError;
        }

        const tasks = taskData || [];
        const total = tasks.length;
        const pending = tasks.filter(t => t.status === "pending").length;
        const inProgress = tasks.filter(t => t.status === "in_progress").length;
        const completed = tasks.filter(t => t.status === "completed").length;

        setTaskStats({ total, pending, inProgress, completed });
        setFilters([
          { id: "all", name: "All Tasks", count: total },
          { id: "pending", name: "Pending", count: pending },
          { id: "in-progress", name: "In Progress", count: inProgress },
          { id: "completed", name: "Completed", count: completed },
        ]);

        // Calculate schedule stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const dueToday = tasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) &&
                 t.status !== "completed";
        }).length;

        const dueThisWeek = tasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate >= today && dueDate < weekFromNow && t.status !== "completed";
        }).length;

        const overdue = tasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate < today && t.status !== "completed";
        }).length;

        setScheduleStats({ dueToday, dueThisWeek, overdue });
      } catch (error) {
        console.error("Error fetching task stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskStats();
  }, [tenantId, refreshKey]);

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleTaskSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setShowAddTaskModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tasks
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your gym operations and tasks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <SmartButton
            variant="secondary"
            size="sm"
            icon={<FiClock className="w-4 h-4" />}
          >
            View Schedule
          </SmartButton>
          <AddButton label="Add Task" onClick={handleAddTask} />
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
              placeholder="Search tasks by title, assignee, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="form-select"
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
        tabs={tabs.map((tab) => ({
          id: tab.id,
          label: tab.name,
          icon: <tab.icon className="w-4 h-4" />,
        }))}
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
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Task Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Tasks
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {isLoading ? "..." : taskStats.total}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center">
                      <FiCheckSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {isLoading ? "..." : taskStats.pending}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center">
                      <FiClock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        In Progress
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {isLoading ? "..." : taskStats.inProgress}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center">
                      <FiBarChart2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {isLoading ? "..." : taskStats.completed}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <FiCheckSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Table */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Tasks
                  </h3>
                  <button className="text-sm text-sky-600 hover:text-sky-700">
                    View All Tasks
                  </button>
                </div>
                <TaskTable refreshKey={refreshKey} />
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <SmartTaskAnalytics refreshKey={refreshKey} />
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Task Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-xl bg-gray-50">
                    <div className="text-3xl font-bold text-sky-600">
                      {isLoading ? "..." : scheduleStats.dueToday}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Due Today
                    </div>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-gray-50">
                    <div className="text-3xl font-bold text-gold-600">
                      {isLoading ? "..." : scheduleStats.dueThisWeek}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Due This Week
                    </div>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-gray-50">
                    <div className="text-3xl font-bold text-rose-600">
                      {isLoading ? "..." : scheduleStats.overdue}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Overdue
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Automation Engine */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Task Automation
                </h3>
                <TaskAutomationEngine refreshKey={refreshKey} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSuccess={handleTaskSuccess}
        isPro={true}
      />
    </div>
  );
};

export default Tasks;
