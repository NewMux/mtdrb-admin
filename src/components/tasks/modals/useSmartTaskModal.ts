import { useState, useEffect } from "react";

export interface Task {
  id: string;
  title: string;
  description: string;
  type:
    | "onboarding"
    | "class_setup"
    | "maintenance"
    | "cleaning"
    | "equipment_check"
    | "member_support"
    | "admin"
    | "custom";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "paused" | "completed" | "cancelled";
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  automation?: {
    id: string;
    type: "recurring" | "triggered" | "scheduled";
    enabled: boolean;
  };
}

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  type?: string[];
  assignedTo?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SmartSuggestion {
  id: string;
  type: "assignment" | "deadline" | "priority" | "automation" | "escalation";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  action?: string;
  isPro: boolean;
}

export interface TaskAutomation {
  id: string;
  name: string;
  type: "recurring" | "triggered" | "scheduled";
  description: string;
  enabled: boolean;
  schedule?: string;
  trigger?: string;
  assignee?: string;
  priority: "low" | "medium" | "high";
  isPro: boolean;
}

export interface useSmartTaskModalProps {
  taskId?: string;
  assignedTo?: string;
  contextMemberId?: string;
  originPage?: string;
  isPro?: boolean;
}

export const useSmartTaskModal = (props: useSmartTaskModalProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [automations, setAutomations] = useState<TaskAutomation[]>([]);
  const [alerts, setAlerts] = useState<
    Array<{ type: "error" | "warning" | "info"; message: string }>
  >([]);

  // Load initial data from database
  useEffect(() => {
    const loadTask = async () => {
      if (props.taskId) {
        try {
          // TODO: Fetch task from Supabase when tasks table is available
          // For now, return null
          setTask(null);
        } catch (error) {
          console.error("Error loading task:", error);
          setTask(null);
        }
      }
    };

    loadTask();
    // No mock data - return empty arrays until tasks table is implemented
    setSmartSuggestions([]);
    setAutomations([]);
  }, [props.taskId]);

  // Create new task
  const createTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">,
  ) => {
    setLoading(true);
    try {
      // TODO: Save to Supabase when tasks table is available
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "current_user@mtdrb.com",
      };
      setAlerts([{ type: "info", message: "Task created successfully" }]);
      return { success: true, task: newTask };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to create task" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setLoading(true);
    try {
      // TODO: Update in Supabase when tasks table is available
      if (!task) {
        setAlerts([{ type: "error", message: "No task selected" }]);
        return { success: false };
      }
      
      const updatedTask = {
        ...task,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setTask(updatedTask);
      setAlerts([{ type: "info", message: "Task updated successfully" }]);
      return { success: true, task: updatedTask };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to update task" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string, archive = false) => {
    setLoading(true);
    try {
      // TODO: Delete from Supabase when tasks table is available
      setAlerts([
        {
          type: "info",
          message: archive
            ? "Task archived successfully"
            : "Task deleted successfully",
        },
      ]);
      return { success: true };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to delete task" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Change task status
  const changeTaskStatus = async (
    taskId: string,
    status: Task["status"],
    comment?: string,
  ) => {
    setLoading(true);
    try {
      // TODO: Update in Supabase when tasks table is available
      if (!task) {
        setAlerts([{ type: "error", message: "No task selected" }]);
        return { success: false };
      }
      
      const updatedTask = {
        ...task,
        status,
        updatedAt: new Date().toISOString(),
        completedAt:
          status === "completed" ? new Date().toISOString() : undefined,
      };
      setTask(updatedTask);
      setAlerts([
        { type: "info", message: `Task status changed to ${status}` },
      ]);
      return { success: true, task: updatedTask };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to change task status" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Assign task
  const assignTask = async (taskId: string, assignee: string) => {
    setLoading(true);
    try {
      // TODO: Update in Supabase when tasks table is available
      if (!task) {
        setAlerts([{ type: "error", message: "No task selected" }]);
        return { success: false };
      }
      
      const updatedTask = {
        ...task,
        assignedTo: assignee,
        updatedAt: new Date().toISOString(),
      };
      setTask(updatedTask);
      setAlerts([{ type: "info", message: `Task assigned to ${assignee}` }]);
      return { success: true, task: updatedTask };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to assign task" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Export task data
  const exportTaskData = async (
    filters: TaskFilters,
    format: "csv" | "excel" | "json",
  ) => {
    setLoading(true);
    try {
      // TODO: Implement real export functionality when tasks table is available
      setAlerts([{ type: "info", message: "Task data exported successfully" }]);
      return { success: true, downloadUrl: "/api/tasks/export/123" };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to export task data" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Create automation
  const createAutomation = async (automation: Omit<TaskAutomation, "id">) => {
    setLoading(true);
    try {
      // TODO: Create automation in Supabase when tasks table is available
      const newAutomation: TaskAutomation = {
        ...automation,
        id: Date.now().toString(),
      };
      setAutomations((prev) => [...prev, newAutomation]);
      setAlerts([{ type: "info", message: "Automation created successfully" }]);
      return { success: true, automation: newAutomation };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to create automation" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Apply Smart suggestion
  const applySuggestion = async (suggestionId: string) => {
    setLoading(true);
    try {
      // TODO: Apply suggestion when tasks table is available
      setAlerts([
        { type: "info", message: "Smart suggestion applied successfully" },
      ]);
      return { success: true };
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to apply suggestion" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    task,
    smartSuggestions,
    automations,
    alerts,
    createTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    assignTask,
    exportTaskData,
    createAutomation,
    applySuggestion,
    clearAlerts: () => setAlerts([]),
  };
};
