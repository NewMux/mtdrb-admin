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

export interface AISuggestion {
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
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [automations, setAutomations] = useState<TaskAutomation[]>([]);
  const [alerts, setAlerts] = useState<
    Array<{ type: "error" | "warning" | "info"; message: string }>
  >([]);

  // Mock data for development
  const mockTask: Task = {
    id: "1",
    title: "Setup new member onboarding",
    description:
      "Complete onboarding process for Sarah Johnson including equipment orientation and class introduction",
    type: "onboarding",
    priority: "high",
    status: "pending",
    assignedTo: "mike.chen@mtdrb.com",
    createdBy: "admin@mtdrb.com",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    dueDate: "2024-01-17T18:00:00Z",
    tags: ["member", "onboarding", "priority"],
    automation: {
      id: "auto_1",
      type: "triggered",
      enabled: true,
    },
  };

  const mockAiSuggestions: AISuggestion[] = [
    {
      id: "1",
      type: "assignment",
      title: "Smart Assignment",
      description: "Mike Chen is most available for onboarding tasks this week",
      confidence: 92,
      impact: "high",
      action: "Assign to Mike Chen",
      isPro: true,
    },
    {
      id: "2",
      type: "deadline",
      title: "Optimal Deadline",
      description: "Recommended deadline: 48 hours (based on similar tasks)",
      confidence: 88,
      impact: "medium",
      action: "Set deadline to 48 hours",
      isPro: false,
    },
    {
      id: "3",
      type: "priority",
      title: "Priority Adjustment",
      description: "This task type typically requires high priority",
      confidence: 85,
      impact: "medium",
      action: "Set priority to high",
      isPro: false,
    },
  ];

  const mockAutomations: TaskAutomation[] = [
    {
      id: "1",
      name: "Daily Cleaning Checklist",
      type: "recurring",
      description: "Automated daily cleaning tasks for gym maintenance",
      enabled: true,
      schedule: "daily 6:00 AM",
      assignee: "cleaning@mtdrb.com",
      priority: "medium",
      isPro: false,
    },
    {
      id: "2",
      name: "Member Onboarding",
      type: "triggered",
      description: "Automated onboarding tasks when new member joins",
      enabled: true,
      trigger: "new_member_registration",
      assignee: "trainer@mtdrb.com",
      priority: "high",
      isPro: true,
    },
    {
      id: "3",
      name: "Monthly Equipment Check",
      type: "scheduled",
      description: "Monthly equipment maintenance and safety checks",
      enabled: false,
      schedule: "monthly 1st 9:00 AM",
      assignee: "maintenance@mtdrb.com",
      priority: "medium",
      isPro: false,
    },
  ];

  // Load initial data
  useEffect(() => {
    if (props.taskId) {
      setTask(mockTask);
    }
    setAiSuggestions(mockAiSuggestions);
    setAutomations(mockAutomations);
  }, [props.taskId]);

  // Create new task
  const createTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">,
  ) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedTask = {
        ...mockTask,
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedTask = {
        ...mockTask,
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedTask = {
        ...mockTask,
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

  // Apply AI suggestion
  const applySuggestion = async (suggestionId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAlerts([
        { type: "info", message: "AI suggestion applied successfully" },
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
    aiSuggestions,
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
