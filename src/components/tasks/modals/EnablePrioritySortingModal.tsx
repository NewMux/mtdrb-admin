import * as React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiArrowUp,
  FiZap,
  FiLock,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface EnablePrioritySortingModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}

export const EnablePrioritySortingModal: React.FC<
  EnablePrioritySortingModalProps
> = ({ open, onClose, isPro = false }) => {
  const { t } = useTranslation();
  const { loading, alerts, clearAlerts } = useSmartTaskModal({ isPro });

  const [sortingEnabled, setSortingEnabled] = React.useState(true);
  const [sortingFactors, setSortingFactors] = React.useState({
    deadline: true,
    impact: true,
    taskType: true,
    assignee: false,
    aiWeight: isPro,
  });

  const [weights, setWeights] = React.useState({
    deadline: 30,
    impact: 25,
    taskType: 20,
    assignee: 15,
    aiWeight: 10,
  });

  const [showPreview, setShowPreview] = React.useState(false);

  const sortingFactorsOptions = [
    {
      key: "deadline",
      label: t("tasks.factorDeadline"),
      description: t("tasks.factorDeadlineDesc"),
      icon: "⏰",
      isPro: false,
    },
    {
      key: "impact",
      label: t("tasks.factorImpact"),
      description: t("tasks.factorImpactDesc"),
      icon: "📈",
      isPro: false,
    },
    {
      key: "taskType",
      label: t("tasks.taskType"),
      description: t("tasks.factorTaskTypeDesc"),
      icon: "🏷️",
      isPro: false,
    },
    {
      key: "assignee",
      label: t("tasks.factorAssignee"),
      description: t("tasks.factorAssigneeDesc"),
      icon: "👤",
      isPro: false,
    },
    {
      key: "aiWeight",
      label: t("tasks.factorAiWeight"),
      description: t("tasks.factorAiWeightDesc"),
      icon: "🤖",
      isPro: true,
    },
  ];

  const mockTasks = [
    {
      id: "1",
      title: "Setup new member onboarding",
      type: "onboarding",
      priority: "high",
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      impact: "high",
      assignee: "Mike Chen",
      score: 95,
    },
    {
      id: "2",
      title: "Monthly equipment maintenance",
      type: "maintenance",
      priority: "medium",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      impact: "medium",
      assignee: "David Rodriguez",
      score: 78,
    },
    {
      id: "3",
      title: "Daily cleaning checklist",
      type: "cleaning",
      priority: "low",
      dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      impact: "low",
      assignee: "Cleaning Team",
      score: 65,
    },
    {
      id: "4",
      title: "Member complaint resolution",
      type: "member_support",
      priority: "urgent",
      dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      impact: "high",
      assignee: "Emma Wilson",
      score: 92,
    },
  ];

  const handleFactorToggle = (factor: string) => {
    setSortingFactors((prev) => ({
      ...prev,
      [factor]: !prev[factor as keyof typeof prev],
    }));
  };

  const handleWeightChange = (factor: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [factor]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onClose();
  };

  const getSortedTasks = () => {
    return [...mockTasks].sort((a, b) => b.score - a.score);
  };

  const sortedTasks = getSortedTasks();

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title={t("tasks.enablePrioritySorting")}
      subtitle={t("tasks.enablePrioritySortingSubtitle")}
    >
      <div className="space-y-6">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alert.type === "error"
                    ? "bg-red-50 text-red-700"
                    : alert.type === "warning"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-blue-50 text-blue-700"
                }`}
              >
                {alert.message}
              </div>
            ))}
            <button
              onClick={clearAlerts}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t("tasks.clearAlerts")}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enable/Disable */}
          <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sortingEnabled}
                onChange={(e) => setSortingEnabled(e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <FiArrowUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("tasks.enableAutomaticPrioritySorting")}
                </span>
              </div>
            </label>
            {sortingEnabled && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                {t("tasks.autoSortDesc")}
              </p>
            )}
          </div>

          {/* Sorting Factors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("tasks.sortingFactors")}
            </label>
            <div className="space-y-2">
              {sortingFactorsOptions.map((factor) => (
                <div
                  key={factor.key}
                  className={`p-3 rounded-lg border transition-all ${
                    sortingFactors[factor.key as keyof typeof sortingFactors]
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={
                          sortingFactors[
                            factor.key as keyof typeof sortingFactors
                          ]
                        }
                        onChange={() => handleFactorToggle(factor.key)}
                        disabled={factor.isPro && !isPro}
                        className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{factor.icon}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {factor.label}
                            </span>
                            {factor.isPro && (
                              <FiLock className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {factor.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    {sortingFactors[
                      factor.key as keyof typeof sortingFactors
                    ] && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{t("tasks.weightLabel")}</span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={weights[factor.key as keyof typeof weights]}
                          onChange={(e) =>
                            handleWeightChange(
                              factor.key,
                              parseInt(e.target.value),
                            )
                          }
                          className="w-16"
                        />
                        <span className="text-xs font-medium w-8">
                          {weights[factor.key as keyof typeof weights]}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weight Distribution */}
          <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("tasks.weightDistribution")}
            </h3>
            <div className="space-y-2">
              {Object.entries(weights).map(([factor, weight]) => {
                const factorOption = sortingFactorsOptions.find(
                  (f) => f.key === factor,
                );
                if (!factorOption) return null;

                return (
                  <div
                    key={factor}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{factorOption.label}</span>
                      {factorOption.isPro && (
                        <FiLock className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${weight}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium w-8">{weight}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t("tasks.sortingPreview")}
              </h3>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showPreview ? t("tasks.hide") : t("tasks.show")} {t("tasks.preview").toLowerCase()}
              </button>
            </div>

            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  {t("tasks.tasksSortedByScore")}
                </div>
                {sortedTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="bg-white rounded p-3 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="text-sm font-medium">
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {task.type} • {task.assignee}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">
                          {task.score}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            task.priority === "urgent"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "high"
                                ? "bg-orange-100 text-orange-700"
                                : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                          }`}
                        >
                          {task.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Pro Features */}
          {!isPro && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
              <div className="flex items-start space-x-3">
                <FiLock className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {t("tasks.proFeaturesAvailable")}
                  </h4>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                    <p>• {t("tasks.proFeatureSmartWeight")}</p>
                    <p>• {t("tasks.proFeatureAdvancedAnalytics")}</p>
                    <p>• {t("tasks.proFeatureCustomSorting")}</p>
                  </div>
                  <button className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 mt-2">
                    {t("tasks.upgradeToPro")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiZap className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("tasks.factorsEnabled", {
                    count: Object.values(sortingFactors).filter(Boolean).length,
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading || !sortingEnabled}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiArrowUp className="w-4 h-4" />
                  <span>
                    {loading ? t("tasks.enabling") : t("tasks.enablePrioritySorting")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SmartTaskModal>
  );
};
