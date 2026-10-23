import * as React from "react";
import { AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiMapPin,
  FiRefreshCw,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRTL } from "../hooks/useRTL";
import { useTranslation } from "react-i18next";
import BranchTable from "../components/branches/BranchTable";
import {
  AddBranchModal,
  EditBranchModal,
  DeleteBranchModal,
  ViewBranchModal,
  ExtraLocationModal,
} from "../components/branches/modals";
import { api } from "../api/client";
import {
  atLocationLimit,
  canBuyExtraLocation,
  fetchLocationUsage,
  unusedExtraLocations,
  extraLocationPrice,
  INCLUDED_LOCATIONS,
  type LocationUsage,
} from "../api/locations";
import { PLATFORM_CURRENCY } from "../config/runtimeConfig";
import { Branch } from "../types";
import AdvancedFilterModal from "../components/ui/AdvancedFilterModal";
import { PageHeader } from "../components/ui/PageHeader";
import { StatStrip } from "../components/ui/StatStrip";

type ModalType = "add" | "edit" | "delete" | "view" | null;

const Branches: React.FC = () => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState("all");
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(
    null,
  );
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  // How many locations the plan allows. null = unknown or unlimited: the
  // database enforces the limit either way, this only explains it up front.
  const [usage, setUsage] = React.useState<LocationUsage | null>(null);
  const [extraLocationMode, setExtraLocationMode] = React.useState<"add" | "release" | null>(null);

  const loadUsage = React.useCallback(async () => {
    setUsage(await fetchLocationUsage());
  }, []);

  // Fetch branches
  const fetchBranches = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await api.branches.getAll();
      if (error) throw error;
      setBranches(data || []);
    } catch (error: unknown) {
      console.error("Error fetching branches:", error);
      const message = error instanceof Error ? error.message : undefined;
      toast.error(
        message || t("branches.errors.failedToFetchBranches") || "Failed to fetch branches"
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchBranches();
    void loadUsage();
  }, [fetchBranches, loadUsage, refreshKey]);


  const filters = [
    {
      id: "all",
      name: t("branches.allBranches") || "All Branches",
      count: branches.length,
    },
    {
      id: "active",
      name: t("branches.active") || "Active",
      count: branches.filter((b) => b.is_active).length,
    },
    {
      id: "inactive",
      name: t("branches.inactive") || "Inactive",
      count: branches.filter((b) => !b.is_active).length,
    },
  ];

  const handleOpenModal = (type: ModalType, branch?: Branch) => {
    setActiveModal(type);
    if (branch) {
      setSelectedBranch(branch);
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedBranch(null);
  };

  const handleModalSuccess = () => {
    toast.success(t("common.success") || "Action completed successfully!");
    handleCloseModal();
    setRefreshKey((prev) => prev + 1);
  };

  // Action handlers
  const handleAddBranch = () => {
    // At the plan's limit the next branch needs a paid extra location: say
    // so (and what it costs) before the form, not after the user filled it in.
    if (usage && atLocationLimit(usage)) {
      setExtraLocationMode("add");
      return;
    }
    handleOpenModal("add");
  };

  // The branch form was submitted at the limit (the page's numbers were stale).
  const handleLimitReached = () => {
    handleCloseModal();
    void loadUsage().then(() => setExtraLocationMode("add"));
  };

  const handleExtraLocationDone = async () => {
    const mode = extraLocationMode;
    setExtraLocationMode(null);
    await loadUsage();
    // Bought a slot because a branch was being added: carry on to the form.
    if (mode === "add") handleOpenModal("add");
  };

  const handleEditBranch = (branch: Branch) => {
    handleOpenModal("edit", branch);
  };

  const handleDeleteBranch = (branch: Branch) => {
    handleOpenModal("delete", branch);
  };

  const handleViewBranch = (branch: Branch) => {
    handleOpenModal("view", branch);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success(t("branches.dataRefreshed") || "Data refreshed");
  };

  // Filter branches based on selected filter
  const filteredBranches = React.useMemo(() => {
    let filtered = branches;

    if (selectedFilter === "active") {
      filtered = filtered.filter((b) => b.is_active);
    } else if (selectedFilter === "inactive") {
      filtered = filtered.filter((b) => !b.is_active);
    }

    return filtered;
  }, [branches, selectedFilter]);

  const unusedExtra = usage ? unusedExtraLocations(usage) : 0;
  const extraPrice = usage ? extraLocationPrice(usage.planTier) : null;
  const locationStat = usage
    ? [
        {
          name: t("branches.locations.stat"),
          value:
            usage.limit === null
              ? t("branches.locations.usageUnlimited", { used: usage.used })
              : t("branches.locations.usageLimited", { used: usage.used, limit: usage.limit }),
          change:
            usage.limit === null
              ? t("branches.locations.detailUnlimited")
              : usage.extraLocations > 0 && extraPrice !== null
                ? t("branches.locations.detailExtra", {
                    count: usage.extraLocations,
                    amount: extraPrice,
                    currency: PLATFORM_CURRENCY,
                  })
                : t("branches.locations.detailIncluded", { count: INCLUDED_LOCATIONS }),
          meter: usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : undefined,
          accessory:
            usage.isAdmin && unusedExtra > 0 && canBuyExtraLocation(usage) ? (
              <button
                type="button"
                onClick={() => setExtraLocationMode("release")}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 whitespace-nowrap"
              >
                {t("branches.locations.removeUnused")}
              </button>
            ) : undefined,
        },
      ]
    : [];

  const branchStats = [
    {
      name: t("branches.totalBranches") || "Total Branches",
      value: branches.length.toString(),
      change: `+${branches.filter((b) => b.is_active).length} ${t("branches.active") || "active"}`,
      icon: FiMapPin,
      color: "bg-blue-500",
    },
    {
      name: t("branches.activeBranches") || "Active Branches",
      value: branches.filter((b) => b.is_active).length.toString(),
      change: `${branches.filter((b) => !b.is_active).length} ${t("branches.inactive") || "inactive"}`,
      icon: FiMapPin,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <PageHeader
        title={t("branches.branchManagement") || "Branch Management"}
        subtitle={t("branches.manageBranchesDesc") || "Manage your gym branches and locations"}
        actions={
          <>
            <button
              onClick={handleRefresh}
              className="btn btn-secondary"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>{t("common.refresh") || "Refresh"}</span>
            </button>
            <button
              onClick={handleAddBranch}
              className="btn btn-primary"
            >
              <FiPlus className="w-4 h-4" />
              <span>{t("branches.addBranch") || "Add Branch"}</span>
            </button>
          </>
        }
      />

      {/* Stats Grid */}
      <StatStrip
        items={[
          ...branchStats.map((stat) => ({ label: stat.name, value: stat.value, detail: stat.change })),
          ...locationStat.map((stat) => ({
            label: stat.name,
            value: stat.value,
            detail: stat.change,
            meter: stat.meter,
            accessory: stat.accessory,
          })),
        ]}
      />

      {/* Search and Filters */}
      <div>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4`} />
            <input
              type="text"
              placeholder={t("branches.searchPlaceholder") || "Search branches..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              aria-label={t("common.filter")}
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="ps-4 pe-9 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

      {/* Branches Table */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="text-start">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("branches.allBranches") || "All Branches"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("branches.manageAllBranches") || "Manage all your gym branches"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {t("common.loading") || "Loading..."}
            </p>
          </div>
        ) : (
          <BranchTable
            branches={filteredBranches}
            onEdit={handleEditBranch}
            onDelete={handleDeleteBranch}
            onView={handleViewBranch}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === "add" && (
          <AddBranchModal
            isOpen={activeModal === "add"}
            onClose={handleCloseModal}
            onSuccess={handleModalSuccess}
            onLimitReached={handleLimitReached}
          />
        )}

        {extraLocationMode && usage && (
          <ExtraLocationModal
            isOpen
            mode={extraLocationMode}
            usage={usage}
            onClose={() => setExtraLocationMode(null)}
            onDone={handleExtraLocationDone}
          />
        )}

        {activeModal === "edit" && selectedBranch && (
          <EditBranchModal
            isOpen={activeModal === "edit"}
            onClose={handleCloseModal}
            branch={selectedBranch}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === "delete" && selectedBranch && (
          <DeleteBranchModal
            isOpen={activeModal === "delete"}
            onClose={handleCloseModal}
            branch={selectedBranch}
            onSuccess={handleModalSuccess}
          />
        )}

        {activeModal === "view" && selectedBranch && (
          <ViewBranchModal
            isOpen={activeModal === "view"}
            onClose={handleCloseModal}
            branch={selectedBranch}
            onEdit={() => {
              handleCloseModal();
              handleEditBranch(selectedBranch);
            }}
          />
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        title={t("branches.advancedFilters") || "Advanced Filters"}
        clearLabel={t("branches.clearAllFilters") || "Clear All Filters"}
        onClear={() => {
          setSelectedFilter("all");
        }}
      >
        {/* Add filter content here if needed */}
      </AdvancedFilterModal>
    </div>
  );
};

export default Branches;
