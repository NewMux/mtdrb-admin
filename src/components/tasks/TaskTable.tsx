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
} from "react-icons/fi";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  dueDate: string;
  createdAt: string;
  avatar: string;
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Update member database",
    description: "Review and update member information in the system",
    assignee: "Sarah Johnson",
    priority: "high",
    status: "in-progress",
    dueDate: "2024-01-25",
    createdAt: "2024-01-20",
    avatar: "SJ",
  },
  {
    id: "2",
    title: "Schedule trainer interviews",
    description: "Arrange interviews for new trainer candidates",
    assignee: "Mike Chen",
    priority: "medium",
    status: "pending",
    dueDate: "2024-01-28",
    createdAt: "2024-01-22",
    avatar: "MC",
  },
  {
    id: "3",
    title: "Review class schedules",
    description: "Check and optimize class schedules for next month",
    assignee: "Emma Wilson",
    priority: "low",
    status: "completed",
    dueDate: "2024-01-23",
    createdAt: "2024-01-18",
    avatar: "EW",
  },
  {
    id: "4",
    title: "Equipment maintenance",
    description: "Schedule maintenance for gym equipment",
    assignee: "David Rodriguez",
    priority: "urgent",
    status: "pending",
    dueDate: "2024-01-24",
    createdAt: "2024-01-21",
    avatar: "DR",
  },
  {
    id: "5",
    title: "Update billing system",
    description: "Implement new payment processing features",
    assignee: "Lisa Thompson",
    priority: "high",
    status: "in-progress",
    dueDate: "2024-01-30",
    createdAt: "2024-01-19",
    avatar: "LT",
  },
];

const TaskTable: React.FC = () => {
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

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
      case "in-progress":
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
          {emptyTasks.map((task, index) => (
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
                    <span className="text-white font-medium text-sm">
                      {task.avatar}
                    </span>
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
                  <span className="text-sm text-gray-900">
                    {task.assignee}
                  </span>
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
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  <span
                    className={`text-sm ${
                      isOverdue(task.dueDate)
                        ? "text-red-600 font-medium"
                        : "text-gray-900"
                    }`}
                  >
                    {new Date(task.dueDate).toLocaleDateString()}
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
