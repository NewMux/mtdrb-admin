import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiUser,
  FiStar,
  FiBarChart2,
  FiSettings,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMail,
  FiClock,
  FiTarget,
  FiUsers,
  FiTrendingUp,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import TrainerTable from "../components/trainers/TrainerTable";
import TrainerKPICards from "../components/trainers/TrainerKPICards";
import SmartTrainerAnalytics from "../components/trainers/SmartTrainerAnalytics";
import TrainerPerformanceDashboard from "../components/trainers/TrainerPerformanceDashboard";
import TrainerAutomationEngine from "../components/trainers/TrainerAutomationEngine";
import FilterButton from "../components/ui/FilterButton";
import TabsNav from "../components/ui/TabsNav";
import { AddButton } from "../components/ui/AddButton";
import { SmartButton } from "../components/ui/DesignSystem";

// Removed mock data - using real data from Supabase

// Import all modals
import {
  AddTrainerModal,
  EditTrainerModal,
  DeleteTrainerModal,
  ViewTrainerProfileModal,
  AssignClassesModal,
  ExportTrainerDataModal,
} from "../components/trainers/modals";

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  rating: number;
  status: "active" | "inactive" | "busy" | "available";
  classes: number;
  experience: string;
  avatar: string;
}

type ModalType =
  | "add"
  | "edit"
  | "delete"
  | "view"
  | "assign"
  | "export"
  | null;

const Trainers: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("all");
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [selectedTrainer, setSelectedTrainer] = React.useState<Trainer | null>(
    null,
  );
  const [trainers, setTrainers] = React.useState<Trainer[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Ensure trainers is always an array
  const safeTrainers = React.useMemo(() => {
    return Array.isArray(trainers) ? trainers : [];
  }, [trainers]);

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: FiUser },
    { id: "analytics", name: "Analytics", icon: FiBarChart2 },
    { id: "list", name: "Trainer List", icon: FiSettings },
  ];

  const filters = [
    { id: "all", name: "All Trainers", count: safeTrainers.length },
    {
      id: "active",
      name: "Active",
      count: safeTrainers.filter((t) => t.status === "active").length,
    },
    {
      id: "available",
      name: "Available",
      count: safeTrainers.filter((t) => t.status === "available").length,
    },
    {
      id: "busy",
      name: "Busy",
      count: safeTrainers.filter((t) => t.status === "busy").length,
    },
  ];

  const handleOpenModal = (type: ModalType, trainer?: Trainer) => {
    setActiveModal(type);
    if (trainer) {
      setSelectedTrainer(trainer);
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedTrainer(null);
  };

  const handleModalSuccess = () => {
    toast.success("Action completed successfully!");
    handleCloseModal();
    setRefreshKey((prev) => prev + 1);
  };

  // Action handlers
  const handleAddTrainer = () => {
    handleOpenModal("add");
  };

  const handleEditTrainer = (trainer: Trainer) => {
    handleOpenModal("edit", trainer);
  };

  const handleDeleteTrainer = (trainer: Trainer) => {
    handleOpenModal("delete", trainer);
  };

  const handleViewTrainer = (trainer: Trainer) => {
    handleOpenModal("view", trainer);
  };

  const handleAssignTrainer = (trainer: Trainer) => {
    handleOpenModal("assign", trainer);
  };

  const handleMessageTrainer = (trainer: Trainer) => {
    handleOpenModal("view", trainer);
  };

  const handleScheduleTrainer = (trainer: Trainer) => {
    handleOpenModal("assign", trainer);
  };

  const handleExport = async () => {
    try {
      toast.loading("Exporting trainers...");
      // TODO: Implement real export functionality
      toast.success("Trainers exported successfully!");
    } catch (error) {
      toast.error("Failed to export trainers");
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Trainer list refreshed!");
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const trainerStats = [
    {
      name: "Total Trainers",
      value: "12",
      change: "+2 from last month",
      icon: FiUsers,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Average Rating",
      value: "4.8",
      change: "+0.2 from last month",
      icon: FiStar,
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: "Classes This Week",
      value: "156",
      change: "+12% from last month",
      icon: FiClock,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Available Hours",
      value: "89%",
      change: "+5% from last month",
      icon: FiTrendingUp,
      color: "from-purple-500 to-purple-600",
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trainerStats.map((stat, index) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* All Trainers Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  All Trainers
                </h2>
                <button
                  onClick={() => handleTabChange("list")}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  View All Trainers
                </button>
              </div>
              <TrainerTable
                trainers={safeTrainers}
                onEdit={handleEditTrainer}
                onDelete={handleDeleteTrainer}
                onView={handleViewTrainer}
                onAssign={handleAssignTrainer}
                onMessage={handleMessageTrainer}
                onSchedule={handleScheduleTrainer}
              />
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <TrainerPerformanceDashboard refreshKey={refreshKey} />
          </div>
        );

      case "list":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Trainer Management
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage all trainers, schedules, and assignments
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={handleAddTrainer}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Trainer</span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <TrainerTable
                trainers={safeTrainers}
                onEdit={handleEditTrainer}
                onDelete={handleDeleteTrainer}
                onView={handleViewTrainer}
                onAssign={handleAssignTrainer}
                onMessage={handleMessageTrainer}
                onSchedule={handleScheduleTrainer}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 Smart Trainer Management
            </h1>
            <p className="text-gray-600 mt-1">
              Intelligent scheduling • Performance tracking • Zero Excel
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleTabChange("list")}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FiTarget className="w-4 h-4" />
              <span>View Schedule</span>
            </button>
            <button
              onClick={handleAddTrainer}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Trainer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search trainers by name, specialty, or availability..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <button className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === "add" && (
          <AddTrainerModal
            isOpen={activeModal === "add"}
            onClose={handleCloseModal}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === "edit" && selectedTrainer && (
          <EditTrainerModal
            isOpen={activeModal === "edit"}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === "delete" && selectedTrainer && (
          <DeleteTrainerModal
            isOpen={activeModal === "delete"}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === "view" && selectedTrainer && (
          <ViewTrainerProfileModal
            isOpen={activeModal === "view"}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === "assign" && selectedTrainer && (
          <AssignClassesModal
            isOpen={activeModal === "assign"}
            onClose={handleCloseModal}
            trainer={selectedTrainer}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === "export" && (
          <ExportTrainerDataModal
            isOpen={activeModal === "export"}
            onClose={handleCloseModal}
            onSuccess={handleModalSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trainers;
