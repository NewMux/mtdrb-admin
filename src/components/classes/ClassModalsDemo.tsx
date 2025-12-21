import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiX,
  FiUsers,
  FiDownload,
  FiSettings,
  FiEye,
  FiStar,
} from "react-icons/fi";
import {
  AddClassModal,
  EditClassModal,
  DeleteClassModal,
  ScheduleClassModal,
  CancelClassModal,
  ProcessWaitlistModal,
  AssignTrainerModal,
  ViewClassDetailsModal,
  ExportClassDataModal,
  UpdateClassSettingsModal,
} from "./modals";

const ClassModalsDemo: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("class-123");

  const modalConfigs = [
    {
      id: "add-class",
      title: "Add New Class",
      description: "Create a new class with comprehensive settings",
      icon: <FiPlus className="h-5 w-5" />,
      color: "bg-green-500 hover:bg-green-600",
      modal: "AddClassModal",
    },
    {
      id: "edit-class",
      title: "Edit Class",
      description: "Modify existing class details and settings",
      icon: <FiEdit className="h-5 w-5" />,
      color: "bg-blue-500 hover:bg-blue-600",
      modal: "EditClassModal",
    },
    {
      id: "delete-class",
      title: "Delete Class",
      description: "Remove class with member notifications",
      icon: <FiTrash2 className="h-5 w-5" />,
      color: "bg-red-500 hover:bg-red-600",
      modal: "DeleteClassModal",
    },
    {
      id: "schedule-class",
      title: "Schedule Class",
      description: "Schedule recurring or one-time classes",
      icon: <FiCalendar className="h-5 w-5" />,
      color: "bg-purple-500 hover:bg-purple-600",
      modal: "ScheduleClassModal",
    },
    {
      id: "cancel-class",
      title: "Cancel Class",
      description: "Cancel class with refunds and notifications",
      icon: <FiX className="h-5 w-5" />,
      color: "bg-orange-500 hover:bg-orange-600",
      modal: "CancelClassModal",
    },
    {
      id: "process-waitlist",
      title: "Process Waitlist",
      description: "Manage waitlist with smart assignment",
      icon: <FiUsers className="h-5 w-5" />,
      color: "bg-indigo-500 hover:bg-indigo-600",
      modal: "ProcessWaitlistModal",
    },
    {
      id: "assign-trainer",
      title: "Assign Trainer",
      description: "Assign trainers with availability checking",
      icon: <FiStar className="h-5 w-5" />,
      color: "bg-yellow-500 hover:bg-yellow-600",
      modal: "AssignTrainerModal",
    },
    {
      id: "view-details",
      title: "View Class Details",
      description: "Comprehensive class information and analytics",
      icon: <FiEye className="h-5 w-5" />,
      color: "bg-teal-500 hover:bg-teal-600",
      modal: "ViewClassDetailsModal",
    },
    {
      id: "export-data",
      title: "Export Class Data",
      description: "Export class data in various formats",
      icon: <FiDownload className="h-5 w-5" />,
      color: "bg-gray-500 hover:bg-gray-600",
      modal: "ExportClassDataModal",
    },
    {
      id: "update-settings",
      title: "Update Class Settings",
      description: "Configure advanced class settings and automation",
      icon: <FiSettings className="h-5 w-5" />,
      color: "bg-pink-500 hover:bg-pink-600",
      modal: "UpdateClassSettingsModal",
    },
  ];

  const handleOpenModal = (modalId: string) => {
    setActiveModal(modalId);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
  };

  const renderModal = () => {
    const props = {
      isOpen: true,
      onClose: handleCloseModal,
      onSuccess: handleSuccess,
      isPro: true,
    };

    switch (activeModal) {
      case "add-class":
        return <AddClassModal {...props} />;
      case "edit-class":
        return <EditClassModal {...props} classId={selectedClassId} />;
      case "delete-class":
        return <DeleteClassModal {...props} classId={selectedClassId} />;
      case "schedule-class":
        return <ScheduleClassModal {...props} />;
      case "cancel-class":
        return <CancelClassModal {...props} classId={selectedClassId} />;
      case "process-waitlist":
        return <ProcessWaitlistModal {...props} classId={selectedClassId} />;
      case "assign-trainer":
        return <AssignTrainerModal {...props} classId={selectedClassId} />;
      case "view-details":
        return <ViewClassDetailsModal {...props} classId={selectedClassId} />;
      case "export-data":
        return <ExportClassDataModal {...props} classId={selectedClassId} />;
      case "update-settings":
        return (
          <UpdateClassSettingsModal {...props} classId={selectedClassId} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-light-50 dark:bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
            Class Management Modals Demo
          </h1>
          <p className="text-light-600 dark:text-dark-400">
            Interactive demo of all smart class management modals with
            Apple-inspired design
          </p>
        </div>

        {/* Modal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modalConfigs.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-light-200 dark:border-dark-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-xl text-white ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                      {config.title}
                    </h3>
                    <p className="text-sm text-light-600 dark:text-dark-400">
                      {config.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenModal(config.id)}
                  className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-200 ${config.color} hover:shadow-lg transform hover:scale-105`}
                >
                  Open {config.title}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-light-200 dark:border-dark-700 p-6">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-6">
            Smart Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FiStar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-900 dark:text-white mb-1">
                  Smart-Powered Recommendations
                </h4>
                <p className="text-sm text-light-600 dark:text-dark-400">
                  Smart suggestions for optimal class management and member
                  experience
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FiCalendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-900 dark:text-white mb-1">
                  Real-time Validation
                </h4>
                <p className="text-sm text-light-600 dark:text-dark-400">
                  Instant feedback and conflict detection for seamless
                  operations
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <FiUsers className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-900 dark:text-white mb-1">
                  Smart Automation
                </h4>
                <p className="text-sm text-light-600 dark:text-dark-400">
                  Automated workflows for waitlist management and trainer
                  assignment
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <FiSettings className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-900 dark:text-white mb-1">
                  Advanced Analytics
                </h4>
                <p className="text-sm text-light-600 dark:text-dark-400">
                  Comprehensive insights and performance tracking for
                  data-driven decisions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                <FiDownload className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-900 dark:text-white mb-1">
                  Flexible Export Options
                </h4>
                <p className="text-sm text-light-600 dark:text-dark-400">
                  Multiple formats and customizable data export capabilities
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                <FiEye className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-900 dark:text-white mb-1">
                  Comprehensive Views
                </h4>
                <p className="text-sm text-light-600 dark:text-dark-400">
                  Detailed class information with member analytics and
                  performance metrics
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            How to Use
          </h3>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <p>• Click any modal button to open the interactive demo</p>
            <p>• Each modal includes realistic data and full functionality</p>
            <p>
              • Test form validation, smart recommendations, and smart features
            </p>
            <p>• Experience the smooth animations and Apple-inspired design</p>
            <p>• All modals are fully responsive and accessible</p>
          </div>
        </div>
      </div>

      {/* Render Active Modal */}
      {activeModal && renderModal()}
    </div>
  );
};

export default ClassModalsDemo;
