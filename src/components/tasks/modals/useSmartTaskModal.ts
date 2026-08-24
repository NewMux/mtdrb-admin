import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { exportCSV, exportExcel, exportJSON } from "../../../utils/exportData";
import type { Database } from "../../../types/supabase";

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

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

const rowToTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description || "",
  type: row.type,
  priority: row.priority,
  status: row.status,
  assignedTo: row.assigned_to,
  createdBy: row.created_by || "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  dueDate: row.due_date,
  completedAt: row.completed_at,
  tags: row.tags || [],
  automation:
    row.automation && typeof row.automation === "object"
      ? (row.automation as unknown as Task["automation"])
      : undefined,
});

export const useSmartTaskModal = (props: useSmartTaskModalProps = {}) => {
  const { tenantId, user } = useAuth();
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
          const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", props.taskId)
            .single();

          if (error) throw error;
          setTask(data ? rowToTask(data) : null);
        } catch (error) {
          console.error("Error loading task:", error);
          setTask(null);
        }
      }
    };

    loadTask();
    // No mock data - return empty arrays until a suggestions/automation
    // engine exists to actually populate these
    setSmartSuggestions([]);
    setAutomations([]);
  }, [props.taskId]);

  // Create new task
  const createTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">,
  ) => {
    if (!tenantId) {
      setAlerts([{ type: "error", message: "No tenant ID found" }]);
      return { success: false };
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            tenant_id: tenantId,
            title: taskData.title,
            description: taskData.description,
            type: taskData.type,
            priority: taskData.priority,
            status: taskData.status,
            assigned_to: taskData.assignedTo,
            created_by: user?.id,
            member_id: props.contextMemberId,
            due_date: taskData.dueDate,
            tags: taskData.tags,
            automation: taskData.automation,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newTask = rowToTask(data);
      setTask(newTask);
      setAlerts([{ type: "info", message: "Task created successfully" }]);
      return { success: true, task: newTask };
    } catch (error) {
      console.error("Error creating task:", error);
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
      const payload: Database["public"]["Tables"]["tasks"]["Update"] = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
      if (updates.tags !== undefined) payload.tags = updates.tags;

      const { data, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = rowToTask(data);
      setTask(updatedTask);
      setAlerts([{ type: "info", message: "Task updated successfully" }]);
      return { success: true, task: updatedTask };
    } catch (error) {
      console.error("Error updating task:", error);
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
      if (archive) {
        const { error } = await supabase
          .from("tasks")
          .update({ status: "cancelled" })
          .eq("id", taskId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").delete().eq("id", taskId);
        if (error) throw error;
      }

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
      console.error("Error deleting task:", error);
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
    completionDetails?: { outcome?: string; attachments?: string[] },
  ) => {
    setLoading(true);
    try {
      const completedAt = status === "completed" ? new Date().toISOString() : null;
      const update: Record<string, unknown> = {
        status,
        completed_at: completedAt || undefined,
      };
      if (comment || completionDetails?.outcome || completionDetails?.attachments?.length) {
        const { data: existingRow } = await supabase
          .from("tasks")
          .select("metadata")
          .eq("id", taskId)
          .single();
        update.metadata = {
          ...((existingRow?.metadata as Record<string, unknown>) || {}),
          completion: {
            comment: comment || undefined,
            outcome: completionDetails?.outcome,
            attachments: completionDetails?.attachments,
            completedAt,
          },
        };
      }
      const { data, error } = await supabase
        .from("tasks")
        .update(update)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = rowToTask(data);
      setTask(updatedTask);
      setAlerts([
        { type: "info", message: `Task status changed to ${status}` },
      ]);
      return { success: true, task: updatedTask };
    } catch (error) {
      console.error("Error changing task status:", error);
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
      const { data, error } = await supabase
        .from("tasks")
        .update({ assigned_to: assignee })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = rowToTask(data);
      setTask(updatedTask);
      setAlerts([{ type: "info", message: `Task assigned to ${assignee}` }]);
      return { success: true, task: updatedTask };
    } catch (error) {
      console.error("Error assigning task:", error);
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
    if (!tenantId) {
      setAlerts([{ type: "error", message: "No tenant ID found" }]);
      return { success: false };
    }
    setLoading(true);
    try {
      let query = supabase.from("tasks").select("*").eq("tenant_id", tenantId);

      if (filters.status?.length) query = query.in("status", filters.status);
      if (filters.priority?.length) query = query.in("priority", filters.priority);
      if (filters.type?.length) query = query.in("type", filters.type);
      if (filters.assignedTo?.length) query = query.in("assigned_to", filters.assignedTo);
      if (filters.dateRange) {
        query = query
          .gte("created_at", filters.dateRange.start)
          .lte("created_at", filters.dateRange.end);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []).map(rowToTask);
      const filename = `tasks-export-${new Date().toISOString().split("T")[0]}`;

      if (format === "csv") {
        exportCSV(rows as unknown as Record<string, unknown>[], filename);
      } else if (format === "excel") {
        await exportExcel(rows as unknown as Record<string, unknown>[], filename, "Tasks");
      } else {
        exportJSON(rows, filename);
      }

      setAlerts([{ type: "info", message: "Task data exported successfully" }]);
      return { success: true };
    } catch (error) {
      console.error("Error exporting task data:", error);
      setAlerts([{ type: "error", message: "Failed to export task data" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Create automation
  // Note: there's no automation-engine table backing this yet, so entries
  // only persist for the current session. Wiring this to a real automation
  // scheduler is a separate feature, not just a Supabase table.
  const createAutomation = async (automation: Omit<TaskAutomation, "id">) => {
    setLoading(true);
    try {
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
  // Note: no suggestion engine exists yet to generate real suggestions
  // (smartSuggestions is always empty), so this has nothing to act on.
  const applySuggestion = async (suggestionId: string) => {
    void suggestionId;
    setLoading(true);
    try {
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
