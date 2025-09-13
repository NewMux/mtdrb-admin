import * as React from "react";
import { motion } from "framer-motion";
import {
  FiPlay,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiPause,
  FiUser,
  FiDownload,
  FiSettings,
  FiUsers,
  FiBell,
  FiTrendingUp,
} from "react-icons/fi";
import {
  AddTaskModal,
  EditTaskModal,
  DeleteTaskModal,
  StartTaskModal,
  CompleteTaskModal,
  PauseTaskModal,
  AssignTaskModal,
  ExportTaskDataModal,
  SetupTaskAutomationModal,
  EnableAutoAssignmentModal,
  EnablePrioritySortingModal,
  EnableDeadlineRemindersModal,
} from "../components/tasks/modals";

const TaskModalsDemo: React.FC = () => {
  const [isPro, setIsPro] = React.useState(false);
  const [activeModals, setActiveModals] = React.useState<
    Record<string, boolean>
  >({});

  const openModal = (modalName: string) => {
    setActiveModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: string) => {
    setActiveModals((prev) => ({ ...prev, [modalName]: false }));
  };

  const taskModals = [
    {
      name: "AddTaskModal",
      title: "Add Task",
      description: "Create new task with smart defaults and smart suggestions",
      icon: FiPlay,
      color: "bg-green-500",
    },
    {
      name: "EditTaskModal",
      title: "Edit Task",
      description:
        "Edit existing task with history tracking and smart warnings",
      icon: FiEdit,
      color: "bg-blue-500",
    },
    {
      name: "DeleteTaskModal",
      title: "Delete Task",
      description: "Delete or archive task with automation warnings",
      icon: FiTrash2,
      color: "bg-red-500",
    },
    {
      name: "StartTaskModal",
      title: "Start Task",
      description: "Start task with timer and status transition options",
      icon: FiPlay,
      color: "bg-green-500",
    },
    {
      name: "CompleteTaskModal",
      title: "Complete Task",
      description: "Mark task as complete with outcome tracking",
      icon: FiCheck,
      color: "bg-green-500",
    },
    {
      name: "PauseTaskModal",
      title: "Pause Task",
      description: "Pause task with reasons and smart reminders",
      icon: FiPause,
      color: "bg-yellow-500",
    },
    {
      name: "AssignTaskModal",
      title: "Assign Task",
      description: "Assign task with smart suggestions and role filtering",
      icon: FiUser,
      color: "bg-purple-500",
    },
    {
      name: "ExportTaskDataModal",
      title: "Export Task Data",
      description: "Export task data with filters and smart insights",
      icon: FiDownload,
      color: "bg-indigo-500",
    },
  ];

  const automationModals = [
    {
      name: "SetupTaskAutomationModal",
      title: "Setup Task Automation",
      description: "Create automated task workflows with templates",
      icon: FiSettings,
      color: "bg-orange-500",
    },
    {
      name: "EnableAutoAssignmentModal",
      title: "Enable Auto Assignment",
      description: "Configure automatic task assignment logic",
      icon: FiUsers,
      color: "bg-purple-500",
    },
    {
      name: "EnablePrioritySortingModal",
      title: "Enable Priority Sorting",
      description: "Auto-sort tasks based on deadlines and impact",
      icon: FiTrendingUp,
      color: "bg-blue-500",
    },
    {
      name: "EnableDeadlineRemindersModal",
      title: "Enable Deadline Reminders",
      description: "Configure deadline notifications and smart detection",
      icon: FiBell,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Task Management Modals Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive demo of all smart task management modals with
            Apple-inspired design
          </p>
        </div>

        {/* Pro Toggle */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPro}
                onChange={(e) => setIsPro(e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pro Features
              </span>
            </label>
            {isPro && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                Pro Mode Active
              </span>
            )}
          </div>
        </div>

        {/* Task Management Modals */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Task Management Modals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskModals.map((modal) => (
              <motion.div
                key={modal.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${modal.color} text-white`}
                  >
                    <modal.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {modal.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {modal.description}
                    </p>
                    <button
                      onClick={() => openModal(modal.name)}
                      className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Open Modal
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Automation Modals */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Task Automation Modals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {automationModals.map((modal) => (
              <motion.div
                key={modal.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${modal.color} text-white`}
                  >
                    <modal.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {modal.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {modal.description}
                    </p>
                    <button
                      onClick={() => openModal(modal.name)}
                      className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Open Modal
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Modal Renderers */}
        <AddTaskModal
          open={activeModals.AddTaskModal || false}
          onClose={() => closeModal("AddTaskModal")}
          isPro={isPro}
        />

        <EditTaskModal
          open={activeModals.EditTaskModal || false}
          onClose={() => closeModal("EditTaskModal")}
          taskId="1"
          isPro={isPro}
        />

        <DeleteTaskModal
          open={activeModals.DeleteTaskModal || false}
          onClose={() => closeModal("DeleteTaskModal")}
          taskId="1"
          isPro={isPro}
        />

        <StartTaskModal
          open={activeModals.StartTaskModal || false}
          onClose={() => closeModal("StartTaskModal")}
          taskId="1"
          isPro={isPro}
        />

        <CompleteTaskModal
          open={activeModals.CompleteTaskModal || false}
          onClose={() => closeModal("CompleteTaskModal")}
          taskId="1"
          isPro={isPro}
        />

        <PauseTaskModal
          open={activeModals.PauseTaskModal || false}
          onClose={() => closeModal("PauseTaskModal")}
          taskId="1"
          isPro={isPro}
        />

        <AssignTaskModal
          open={activeModals.AssignTaskModal || false}
          onClose={() => closeModal("AssignTaskModal")}
          taskId="1"
          isPro={isPro}
        />

        <ExportTaskDataModal
          open={activeModals.ExportTaskDataModal || false}
          onClose={() => closeModal("ExportTaskDataModal")}
          isPro={isPro}
        />

        <SetupTaskAutomationModal
          open={activeModals.SetupTaskAutomationModal || false}
          onClose={() => closeModal("SetupTaskAutomationModal")}
          isPro={isPro}
        />

        <EnableAutoAssignmentModal
          open={activeModals.EnableAutoAssignmentModal || false}
          onClose={() => closeModal("EnableAutoAssignmentModal")}
          isPro={isPro}
        />

        <EnablePrioritySortingModal
          open={activeModals.EnablePrioritySortingModal || false}
          onClose={() => closeModal("EnablePrioritySortingModal")}
          isPro={isPro}
        />

        <EnableDeadlineRemindersModal
          open={activeModals.EnableDeadlineRemindersModal || false}
          onClose={() => closeModal("EnableDeadlineRemindersModal")}
          isPro={isPro}
        />
      </div>
    </div>
  );
};

export default TaskModalsDemo;
