import * as React from "react";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheck,
  FiUser,
  FiCalendar,
  FiCheckSquare,
  FiAlertCircle,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import type { Task, UserProfile } from "../../types";
import { EmptyState } from "../ui/DesignSystem";

interface TaskRowData {
  task: Task;
  assigneeName: string;
  avatarText: string;
  avatarUrl?: string;
}

interface TaskTableProps {
  refreshKey?: number;
}

const getErrorCode = (error: unknown): string | undefined =>
  error && typeof error === "object"
    ? (error as { code?: string }).code
    : undefined;

const getErrorMessage = (error: unknown): string | undefined =>
  error && typeof error === "object"
    ? (error as { message?: string }).message
    : undefined;

const isMissingTableError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  return (
    code === "PGRST116" ||
    (message?.includes("relation") ?? false) ||
    (message?.includes("does not exist") ?? false)
  );
};

const TaskTable: React.FC<TaskTableProps> = ({ refreshKey = 0 }) => {
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [assigneesById, setAssigneesById] = React.useState<
    Record<string, UserProfile>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  /**
   * Build initials from a full name.
   */
  const getInitials = React.useCallback((name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, []);

  /**
   * Fetch tasks and associated assignees for the tenant.
   */
  const fetchTasks = React.useCallback(async () => {
    if (!tenantId) {
      console.warn("TaskTable: No tenantId available");
      setLoading(false);
      setError("No tenant ID available. Please ensure you're logged in.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from member_tasks table, but handle if it doesn't exist
      let taskData = null;
      let taskError = null;
      
      try {
        console.log("TaskTable: Fetching tasks for tenant:", tenantId);
        const result = await supabase
          .from("member_tasks")
          .select(
            "id, tenant_id, member_id, title, description, type, priority, status, due_date, assigned_to, created_by, created_at, updated_at, completed_at",
          )
          .eq("tenant_id", tenantId)
          .order("due_date", { ascending: true });
        taskData = result.data;
        taskError = result.error;
        
        console.log("TaskTable: Query result:", { 
          dataCount: taskData?.length || 0, 
          error: taskError,
          errorCode: taskError?.code,
          errorMessage: taskError?.message 
        });
      } catch (err: unknown) {
        // Table might not exist
        if (isMissingTableError(err)) {
          console.warn("member_tasks table may not exist, returning empty tasks");
          setTasks([]);
          setAssigneesById({});
          setLoading(false);
          return;
        }
        throw err;
      }

      if (taskError) {
        // If table doesn't exist, return empty
        if (taskError.code === "PGRST116" || taskError.message?.includes("relation") || taskError.message?.includes("does not exist")) {
          console.warn("member_tasks table does not exist");
          setTasks([]);
          setAssigneesById({});
          setLoading(false);
          return;
        }
        // Log the actual error for debugging
        console.error("Task query error:", taskError);
        throw taskError;
      }

      const assigneeIds = (taskData || [])
        .map((task) => task.assigned_to)
        .filter((assigneeId): assigneeId is string => Boolean(assigneeId));

      if (assigneeIds.length === 0) {
        setTasks(taskData || []);
        setAssigneesById({});
        setLoading(false);
        return;
      }

      // Try to fetch profiles, but handle if table doesn't exist
      let profileData = null;
      let profileError = null;
      
      try {
        const profileResult = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", assigneeIds);
        profileData = profileResult.data;
        profileError = profileResult.error;
      } catch (err: unknown) {
        // Profiles table might not exist, continue without assignee names
        if (isMissingTableError(err)) {
          console.warn("profiles table may not exist, continuing without assignee names");
          setTasks(taskData || []);
          setAssigneesById({});
          setLoading(false);
          return;
        }
        throw err;
      }

      if (profileError && profileError.code !== "PGRST116") {
        // Non-critical error, continue without profiles
        console.warn("Error fetching profiles:", profileError);
      }

      const profileMap = (profileData || []).reduce(
        (acc, profile) => ({
          ...acc,
          [profile.user_id]: profile,
        }),
        {} as Record<string, UserProfile>,
      );

      setTasks(taskData || []);
      setAssigneesById(profileMap);
      setLoading(false);
    } catch (err: unknown) {
      console.error("Error loading tasks:", err);

      // Check for specific error types
      let errorMessage = t("messages.somethingWentWrong");
      const errCode = getErrorCode(err);
      const errMessage = getErrorMessage(err);

      if (errCode === "PGRST116" || errMessage?.includes("relation") || errMessage?.includes("does not exist")) {
        errorMessage = t("messages.noData");
      } else if (errCode === "42501" || errMessage?.includes("permission denied") || errMessage?.includes("row-level security")) {
        errorMessage = t("messages.error");
      } else if (errCode === "42883" || (errMessage?.includes("function") && errMessage?.includes("does not exist"))) {
        errorMessage = t("messages.error");
      } else if (errMessage?.includes("invalid input syntax for type uuid") || errMessage?.includes("uuid")) {
        errorMessage = t("messages.error");
      } else if (errMessage) {
        // Don't show raw database errors to users - provide friendly message
        const rawMessage = errMessage.toLowerCase();
        if (rawMessage.includes("uuid") || rawMessage.includes("invalid input")) {
          errorMessage = t("messages.error");
        } else if (rawMessage.includes("network") || rawMessage.includes("fetch")) {
          errorMessage = t("messages.tryAgain");
        } else {
          errorMessage = t("messages.somethingWentWrong");
        }
      } else if (err instanceof Error) {
        errorMessage = t("messages.somethingWentWrong");
      }

      setError(errorMessage);
      // Set empty state to prevent UI crashes
      setTasks([]);
      setAssigneesById({});
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
      case "high":
        return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case "low":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400";
      case "in_progress":
        return "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case "cancelled":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const taskRows = React.useMemo<TaskRowData[]>(() => {
    return tasks.map((task) => {
      const profile = assigneesById[task.assigned_to];
      const assigneeName = profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : task.assigned_to || "Unassigned";
      const avatarText = getInitials(assigneeName);
      return {
        task,
        assigneeName,
        avatarText,
        avatarUrl: profile?.avatar_url,
      };
    });
  }, [assigneesById, getInitials, tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
          <div className="flex-shrink-0">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">{error}</p>
            <button
              onClick={() => fetchTasks()}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              {t("messages.tryAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0 && !loading && !error) {
    return (
      <EmptyState
        icon={<FiCheckSquare className="w-12 h-12 text-gray-400" />}
        title={t("tasks.emptyStateTitle")}
        description={t("tasks.emptyStateDescription")}
        action={
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-gray-500">
              {t("tasks.emptyStateAction")}
            </p>
          </div>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("tasks.tableTask")}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("tasks.tableAssignee")}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("tasks.tablePriority")}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("tasks.tableStatus")}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("tasks.tableDueDate")}
            </th>
            <th className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
              {t("tasks.tableActions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {taskRows.map(({ task, assigneeName, avatarText, avatarUrl }, index) => (
            <motion.tr
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                index % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50/50 dark:bg-gray-800/50"
              }`}
              onMouseEnter={() => setHoveredRow(task.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-6 py-4">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={assigneeName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {avatarText}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {task.description}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2`}>
                  <FiUser className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-white">{assigneeName}</span>
                </div>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                >
                  {task.priority === "low" ? t("tasks.low") :
                   task.priority === "medium" ? t("tasks.medium") :
                   task.priority === "high" ? t("tasks.high") :
                   task.priority === "urgent" ? t("tasks.urgent") :
                   (task.priority as string).charAt(0).toUpperCase() + (task.priority as string).slice(1)}
                </span>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                >
                  {task.status === "pending" ? t("tasks.pending") :
                   task.status === "in_progress" ? t("tasks.inProgress") :
                   task.status === "completed" ? t("tasks.completed") :
                   task.status === "cancelled" ? t("tasks.cancelled") :
                   (task.status as string)
                     .split("_")
                     .map((segment: string) =>
                       segment.charAt(0).toUpperCase() + segment.slice(1),
                     )
                     .join(" ")}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2`}>
                  <FiCalendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span
                    className={`text-sm ${
                      task.due_date && isOverdue(task.due_date)
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </td>

              <td className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                <div
                  className={`flex items-center ${isRTL ? 'justify-start flex-row-reverse space-x-reverse' : 'justify-end'} space-x-2 transition-opacity duration-200 ${
                    hoveredRow === task.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <FiEye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <FiEdit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors duration-200">
                    <FiCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200">
                    <FiTrash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
