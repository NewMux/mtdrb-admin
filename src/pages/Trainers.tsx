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
  FiClock,
  FiTarget,
  FiUsers,
  FiTrendingUp,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRTL } from "../hooks/useRTL";
import { useTranslation } from "react-i18next";
import TrainerTable from "../components/trainers/TrainerTable";
import TrainerPerformanceDashboard from "../components/trainers/TrainerPerformanceDashboard";
import AdvancedFilterModal from "../components/ui/AdvancedFilterModal";
import { supabase } from "../supabaseClient";
import { mapDbTrainerToUI } from "../mocks/demoData";

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
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("all");
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [selectedTrainer, setSelectedTrainer] = React.useState<Trainer | null>(
    null,
  );
  const [trainers, setTrainers] = React.useState<Trainer[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  // Fetch trainers from API (mock data on localhost)
  React.useEffect(() => {
    const loadTrainers = async () => {
      const { data, error } = await supabase
        .from("trainers")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setTrainers(
          (data as Parameters<typeof mapDbTrainerToUI>[0][]).map(mapDbTrainerToUI),
        );
      }
    };
    loadTrainers();
  }, [refreshKey]);

  // Ensure trainers is always an array
  const safeTrainers = React.useMemo(() => {
    return Array.isArray(trainers) ? trainers : [];
  }, [trainers]);


  const tabs = [
    { id: "dashboard", name: t("trainers.dashboard"), icon: FiUser },
    { id: "analytics", name: t("trainers.analytics"), icon: FiBarChart2 },
    { id: "list", name: t("trainers.trainerList"), icon: FiSettings },
  ];

  const filters = [
    { id: "all", name: t("trainers.allTrainers"), count: safeTrainers.length },
    {
      id: "active",
      name: t("trainers.active"),
      count: safeTrainers.filter((t) => t.status === "active").length,
    },
    {
      id: "available",
      name: t("trainers.available"),
      count: safeTrainers.filter((t) => t.status === "available").length,
    },
    {
      id: "busy",
      name: t("trainers.busy"),
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
    toast.success(t("common.success") || "Action completed successfully!");
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
      toast.loading(t("trainers.export") + "...");
      // TODO: Implement real export functionality
      toast.success(t("trainers.exportSuccessful"));
    } catch (error) {
      toast.error(t("trainers.exportFailed"));
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success(t("trainers.dataRefreshed"));
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const trainerStats = [
    {
      name: t("trainers.totalTrainers"),
      value: "12",
      change: `+2 ${t("trainers.fromLastMonth")}`,
      icon: FiUsers,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: t("trainers.averageRating"),
      value: "4.8",
      change: `+0.2 ${t("trainers.fromLastMonth")}`,
      icon: FiStar,
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: t("trainers.classesThisWeek"),
      value: "156",
      change: `+12% ${t("trainers.fromLastMonth")}`,
      icon: FiClock,
      color: "from-green-500 to-green-600",
    },
    {
      name: t("trainers.availableHours"),
      value: "89%",
      change: `+5% ${t("trainers.fromLastMonth")}`,
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
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-start">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* All Trainers Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-start">
                  {t("trainers.allTrainers")}
                </h2>
                <button
                  onClick={() => handleTabChange("list")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t("trainers.viewAllTrainers")}
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="text-start">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t("trainers.trainerManagement")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("trainers.manageAllTrainers")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>{t("trainers.export")}</span>
                  </button>
                  <button
                    onClick={handleAddTrainer}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>{t("trainers.addTrainer")}</span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    <span>{t("trainers.refresh")}</span>
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
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("trainers.smartTrainerManagement")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t("trainers.intelligentScheduling")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabChange("list")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <FiTarget className="w-4 h-4" />
              <span>{t("trainers.viewSchedule")}</span>
            </button>
            <button
              onClick={handleAddTrainer}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>{t("trainers.addTrainer")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
            <input
              type="text"
              placeholder={t("trainers.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showAdvancedFilters
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Advanced filters"
            >
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            onEdit={() => handleOpenModal("edit", selectedTrainer)}
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

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title={t("trainers.advancedFilters")}
        clearLabel={t("trainers.clearAllFilters")}
        onClear={() => {
          setSelectedFilter("all");
        }}
      >
        {/* Specialty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("trainers.specialty")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("trainers.allSpecialties")}</option>
            <option value="strength">Strength Training</option>
            <option value="cardio">Cardio</option>
            <option value="hiit">HIIT</option>
            <option value="yoga">Yoga</option>
            <option value="pilates">Pilates</option>
            <option value="crossfit">CrossFit</option>
            <option value="boxing">Boxing</option>
            <option value="nutrition">Nutrition</option>
            <option value="rehabilitation">Rehabilitation</option>
          </select>
        </div>

        {/* Experience Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("trainers.experienceLevel")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("trainers.allLevels")}</option>
            <option value="beginner">Beginner (0-2 years)</option>
            <option value="intermediate">Intermediate (2-5 years)</option>
            <option value="advanced">Advanced (5-10 years)</option>
            <option value="expert">Expert (10+ years)</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("trainers.minimumRating")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("trainers.anyRating")}</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="3.0">3.0+ Stars</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("trainers.status")}
          </label>
          <select className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all" dir={isRTL ? "rtl" : "ltr"}>
            <option value="">{t("trainers.allStatuses")}</option>
            <option value="active">{t("trainers.active")}</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="available">{t("trainers.available")}</option>
            <option value="busy">{t("trainers.busy")}</option>
          </select>
        </div>
      </AdvancedFilterModal>
    </div>
  );
};

export default Trainers;
