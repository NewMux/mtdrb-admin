import * as React from "react";
import { motion } from "framer-motion";
import {
  FiMoreHorizontal,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheck,
  FiClock,
  FiUser,
  FiCalendar,
  FiCheckSquare,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { Task, UserProfile } from "../../types";

interface TaskRowData {
  task: Task;
  assigneeName: string;
  avatarText: string;
  avatarUrl?: string;
}

interface TaskTableProps {
  refreshKey?: number;
}

const TaskTable: React.FC<TaskTableProps> = ({ refreshKey = 0 }) => {
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [assigneesById, setAssigneesById] = React.useState<
    Record<string, UserProfile>
  >({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { tenantId } = useAuth();

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
      } catch (err: any) {
        // Table might not exist
        if (err?.code === "PGRST116" || err?.message?.includes("relation") || err?.message?.includes("does not exist")) {
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
      } catch (err: any) {
        // Profiles table might not exist, continue without assignee names
        if (err?.code === "PGRST116" || err?.message?.includes("relation") || err?.message?.includes("does not exist")) {
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
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      
      // Check for specific error types
      let errorMessage = "Failed to load tasks";
      
      if (err?.code === "PGRST116" || err?.message?.includes("relation") || err?.message?.includes("does not exist")) {
        errorMessage = "The tasks table may not exist yet. Please create the member_tasks table in your database.";
      } else if (err?.code === "42501" || err?.message?.includes("permission denied") || err?.message?.includes("row-level security")) {
        errorMessage = "Permission denied. Please check your Row Level Security policies for the member_tasks table.";
      } else if (err?.code === "42883" || err?.message?.includes("function") && err?.message?.includes("does not exist")) {
        errorMessage = "Database function missing. Please ensure get_user_tenant_id() function exists in your database.";
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      // Set empty state to prevent UI crashes
      setTasks([]);
      setAssigneesById({});
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-rose-100 text-rose-800";
      case "medium":
        return "bg-gold-100 text-gold-800";
      case "low":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "in_progress":
        return "bg-sky-100 text-sky-800";
      case "pending":
        return "bg-gold-100 text-gold-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700 font-medium mb-2">{error}</p>
        {error.includes("table may not exist") && (
          <p className="text-xs text-red-600 mt-2">
            Run the SQL script in <code className="bg-red-100 px-1 rounded">supabase/create_member_tasks_table.sql</code> to create the table.
          </p>
        )}
        {error.includes("Permission denied") && (
          <p className="text-xs text-red-600 mt-2">
            Check your Row Level Security policies. Ensure the <code className="bg-red-100 px-1 rounded">get_user_tenant_id()</code> function exists.
          </p>
        )}
        {error.includes("function") && error.includes("does not exist") && (
          <p className="text-xs text-red-600 mt-2">
            Create the <code className="bg-red-100 px-1 rounded">get_user_tenant_id()</code> function in your database.
          </p>
        )}
      </div>
    );
  }

  if (tasks.length === 0 && !loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
        <FiCheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 font-medium">No tasks found</p>
        <p className="text-xs text-gray-500 mt-1">
          Create your first task to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Task
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Assignee
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Priority
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Due Date
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {taskRows.map(({ task, assigneeName, avatarText, avatarUrl }, index) => (
            <motion.tr
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`hover:bg-gray-50 transition-colors duration-200 ${
                index % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50/50/50"
              }`}
              onMouseEnter={() => setHoveredRow(task.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
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
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    <div className="text-xs text-gray-500 max-w-xs truncate">
                      {task.description}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{assigneeName}</span>
                </div>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </span>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                >
                  {task.status
                    .split("_")
                    .map((segment) =>
                      segment.charAt(0).toUpperCase() + segment.slice(1),
                    )
                    .join(" ")}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  <span
                    className={`text-sm ${
                      task.due_date && isOverdue(task.due_date)
                        ? "text-red-600 font-medium"
                        : "text-gray-900"
                    }`}
                  >
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 text-right">
                <div
                  className={`flex items-center justify-end space-x-2 transition-opacity duration-200 ${
                    hoveredRow === task.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <FiEye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <FiEdit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-emerald-100 transition-colors duration-200">
                    <FiCheck className="w-4 h-4 text-emerald-500" />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-red-100 transition-colors duration-200">
                    <FiTrash2 className="w-4 h-4 text-red-500" />
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
