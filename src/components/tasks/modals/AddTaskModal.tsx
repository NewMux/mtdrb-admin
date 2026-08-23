import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiUser,
  FiZap,
  FiInfo,
  FiCheck,
  FiAlertTriangle,
  FiStar,
  FiTrendingUp,
  FiSettings,
} from "react-icons/fi";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { AppleInput, AppleSelect, AppleTextarea } from "../../AppleStyleModal";
import {
  useSmartTaskModal,
  type SmartSuggestion,
} from "./useSmartTaskModal";
import { SmartButton } from "../../ui/DesignSystem";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
// Removed mock data - using real data from Supabase

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

type TaskType =
  | "onboarding"
  | "class_setup"
  | "maintenance"
  | "cleaning"
  | "equipment_check"
  | "member_support"
  | "admin"
  | "custom";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface TaskFormData {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  tags: string;
  estimatedHours: number;
}

interface RecentTask {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  open,
  onClose,
  onSuccess,
  isPro = false,
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    type: "custom",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
    tags: "",
    estimatedHours: 1,
  });

  const [loading, setLoading] = useState(false);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);

  const { tenantId } = useAuth();
  const { createTask, smartSuggestions } =
    useSmartTaskModal({
      isPro,
    });

  useEffect(() => {
    const fetchRecentTasks = async () => {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, type, priority")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(3);
      if (!error && data) {
        setRecentTasks(data as RecentTask[]);
      }
    };
    if (open) {
      fetchRecentTasks();
    }
  }, [open, tenantId]);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from("trainers")
        .select("id, first_name, last_name")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .order("first_name", { ascending: true });
      if (!error && data) {
        setStaff(
          data.map((trainer) => ({
            id: trainer.id,
            name: `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim(),
          })),
        );
      }
    };
    if (open) {
      fetchStaff();
    }
  }, [open, tenantId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "estimatedHours" ? parseInt(value) || 1 : value,
    }));
    // Clear field-specific errors
    setErrors((prev) => prev.filter((error) => error.field !== name));
  };

  const validateForm = (data: typeof formData) => {
    const newErrors: Array<{ field: string; message: string }> = [];

    if (!data.title.trim()) {
      newErrors.push({ field: "title", message: "Task title is required" });
    }

    if (!data.type) {
      newErrors.push({ field: "type", message: "Task type is required" });
    }

    if (!data.priority) {
      newErrors.push({ field: "priority", message: "Priority is required" });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm(formData)) {
      return;
    }
    setLoading(true);
    try {
      const result = await createTask({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        status: "pending",
        assignedTo: formData.assignedTo || undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => {
    return errors.find((error) => error.field === field)?.message;
  };

  const taskTypes = [
    { value: "onboarding", label: "Member Onboarding" },
    { value: "class_setup", label: "Class Setup" },
    { value: "maintenance", label: "Equipment Maintenance" },
    { value: "cleaning", label: "Facility Cleaning" },
    { value: "equipment_check", label: "Equipment Check" },
    { value: "member_support", label: "Member Support" },
    { value: "admin", label: "Administrative" },
    { value: "custom", label: "Custom Task" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "urgent", label: "Urgent" },
  ];

  const staffOptions: Array<{ value: string; label: string }> = staff.map(
    (trainer) => ({
      value: trainer.id,
      label: trainer.name,
    }),
  );

  const isFormValid = formData.title && formData.type && formData.priority;

  // Auto-set priority based on task type
  useEffect(() => {
    if (formData.type) {
      let newPriority: TaskPriority = "medium";
      if (["maintenance", "equipment_check"].includes(formData.type)) {
        newPriority = "high";
      } else if (["onboarding", "member_support"].includes(formData.type)) {
        newPriority = "medium";
      } else if (["cleaning", "admin"].includes(formData.type)) {
        newPriority = "low";
      }
      setFormData((prev) => ({ ...prev, priority: newPriority }));
    }
  }, [formData.type]);

  const footer = (
    <>
      <div className="flex items-center space-x-2">
        {errors.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-orange-600">
            <FiAlertTriangle className="h-4 w-4" />
            <span>{errors.length} validation errors</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <SmartButton
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </SmartButton>
        <SmartButton
          variant="primary"
          onClick={handleSave}
          loading={loading}
          disabled={!isFormValid || loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {loading ? "Creating Task..." : "Create Task"}
        </SmartButton>
      </div>
    </>
  );

  return (
    <UnifiedModal
      isOpen={open}
      onClose={onClose}
      title="Add New Task"
      subtitle="Create a new task with smart automation"
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {/* Pro-only Smart Recommendations */}
        {isPro && smartSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4"
          >
            <div className="flex items-center space-x-2 mb-3">
              <FiZap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Smart Recommendations
              </h3>
              <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
                <FiStar className="h-3 w-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">
                  PRO
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {smartSuggestions.map((suggestion: SmartSuggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 bg-white/50 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-700">
                      {suggestion.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Task Details Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiSettings className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Task Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Task Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Setup new yoga equipment"
              error={getError("title")}
              required
              aria-label="Task title"
            />
            <AppleSelect
              label="Task Type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              aria-label="Task type"
              error={getError("type")}
            >
              <option value="">Select task type</option>
              {taskTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </AppleSelect>
          </div>

          <AppleTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the task, requirements, and expected outcomes..."
            rows={4}
            aria-label="Task description"
          />
        </section>

        {/* Priority & Assignment Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Priority & Assignment
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleSelect
              label="Priority Level"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              required
              aria-label="Priority level"
              error={getError("priority")}
            >
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </AppleSelect>
            <AppleSelect
              label="Assigned To"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              aria-label="Assigned to"
              error={getError("assignedTo")}
            >
              <option value="">Select staff member</option>
              {staffOptions.map((staff) => (
                <option key={staff.value} value={staff.value}>
                  {staff.label}
                </option>
              ))}
            </AppleSelect>
          </div>

          {/* Priority auto-set notification */}
          {formData.type && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <FiInfo className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Priority auto-set to {formData.priority} based on task type
              </span>
            </motion.div>
          )}
        </section>

        {/* Schedule & Organization Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiCalendar className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Schedule & Organization
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppleInput
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleInputChange}
              aria-label="Due date"
              error={getError("dueDate")}
              min={new Date().toISOString().split("T")[0]}
            />
            <AppleInput
              label="Estimated Hours"
              name="estimatedHours"
              type="number"
              value={formData.estimatedHours.toString()}
              onChange={handleInputChange}
              aria-label="Estimated hours"
              error={getError("estimatedHours")}
              min="1"
            />
            <AppleInput
              label="Tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="maintenance, equipment, urgent"
              aria-label="Tags"
              error={getError("tags")}
            />
          </div>
        </section>

        {/* Recent Similar Tasks */}
        {recentTasks.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600">
                <FiTrendingUp className="h-5 w-5 text-white" />
              </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Recent Similar Tasks
            </h3>
            </div>

            <div className="space-y-2">
              {recentTasks.slice(0, 3).map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FiCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {task.type}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </form>
    </UnifiedModal>
  );
};

export default AddTaskModal;
export { AddTaskModal };
