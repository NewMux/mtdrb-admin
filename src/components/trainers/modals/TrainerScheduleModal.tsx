import React, { useState } from "react";
import {
  FiX,
  FiCalendar,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiShield,
  FiDownload,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerSummary {
  name: string;
  email: string;
}

interface TrainerScheduleModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: TrainerSummary;
}

const TrainerScheduleModal: React.FC<TrainerScheduleModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activityType, setActivityType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mockSchedule = [
    {
      id: 1,
      date: "2024-01-22",
      startTime: "09:00",
      endTime: "10:00",
      activity: "Yoga Basics",
      type: "class",
      status: "confirmed",
    },
    {
      id: 2,
      date: "2024-01-22",
      startTime: "14:00",
      endTime: "15:00",
      activity: "Personal Training - Sarah J.",
      type: "session",
      status: "confirmed",
    },
    {
      id: 3,
      date: "2024-01-23",
      startTime: "10:00",
      endTime: "11:00",
      activity: "Pilates Intermediate",
      type: "class",
      status: "pending",
    },
  ];

  const handleAddSchedule = async () => {
    if (!selectedDate || !startTime || !endTime || !activityType) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
    setActivityType("");
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("trainers.trainerSchedule")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("trainers.trainerScheduleDesc")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Trainer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {t("trainers.trainerInformation")}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("common.name")}:</span>
                <span className="font-medium">
                  {trainer?.name || "John Doe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("common.email")}:</span>
                <span className="font-medium">
                  {trainer?.email || "john@fit.com"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("trainers.availability")}:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {t("trainers.available")}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                12
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("trainers.classesThisWeek")}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                8
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("trainers.personalSessions")}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                85%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("trainers.capacityUtilization")}
              </div>
            </div>
          </div>

          {/* Add Schedule */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("trainers.addScheduleItem")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("common.date")}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("trainers.activityType")}
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t("trainers.selectActivity")}</option>
                  <option value="class">{t("trainers.groupClass")}</option>
                  <option value="session">{t("trainers.personalTraining")}</option>
                  <option value="consultation">{t("trainers.consultation")}</option>
                  <option value="meeting">{t("trainers.staffMeeting")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("trainers.startTime")}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("trainers.endTime")}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={handleAddSchedule}
              disabled={
                !selectedDate ||
                !startTime ||
                !endTime ||
                !activityType ||
                isLoading
              }
              className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiPlus className="w-4 h-4" />
              )}
              <span>{t("trainers.addToSchedule")}</span>
            </button>
          </div>

          {/* Smart Insights for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    {t("trainers.smartScheduleOptimization")}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    {t("trainers.scheduleOptimizationDesc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Schedule List */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("trainers.upcomingSchedule")}
            </h3>
            <div className="space-y-3">
              {mockSchedule.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.activity}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        <span>
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "confirmed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {item.status === "confirmed" ? t("trainers.confirmedStatus") : t("common.pending")}
                      </span>
                      <div className="flex space-x-2">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <FiEdit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <FiTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {t("common.close")}
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2">
              <FiCalendar className="w-4 h-4" />
              <span>{t("trainers.calendarView")}</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>{t("trainers.exportSchedule")}</span>
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerScheduleModal;
