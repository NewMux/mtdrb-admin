import React from "react";
import {
  FiUser,
  FiTrendingUp,
  FiStar,
  FiFlag,
  FiXCircle,
} from "react-icons/fi";

/**
 * TrainerPerformancePanel displays top trainers and flags.
 * @returns {JSX.Element}
 */
const topTrainers = [
  {
    name: "Sarah",
    attendance: 98,
    rating: 4.9,
    upsells: 12,
    avatar: "",
    flagged: false,
  },
  {
    name: "Mike",
    attendance: 95,
    rating: 4.7,
    upsells: 9,
    avatar: "",
    flagged: false,
  },
  {
    name: "Emma",
    attendance: 92,
    rating: 4.8,
    upsells: 7,
    avatar: "",
    flagged: false,
  },
];
const mostMissed = { name: "David", missed: 3, avatar: "" };

const TrainerPerformancePanel: React.FC = () => (
  <section className="rounded-3xl shadow-xl p-10 mb-10 bg-white/70 dark:bg-gray-800/70 border border-[#E5E7EB] dark:border-gray-700 backdrop-blur-md bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700">
    <h2 className="text-3xl md:text-4xl font-extrabold mb-10 tracking-tight text-[#111827] dark:text-white">
      Trainer Performance
    </h2>
    <div className="flex flex-col gap-10">
      {/* Top Trainers */}
      <div className="rounded-3xl shadow-md p-6 bg-green-50 dark:bg-green-900/20">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <FiTrendingUp className="mr-2" />
          Top Trainers
        </h3>
        <ul className="space-y-3">
          {topTrainers.map((t, idx) => (
            <li key={idx} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center border border-green-200 dark:border-green-700">
                <FiUser className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">{t.name}</span>
                <div className="flex space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    <FiTrendingUp className="inline mr-1 text-green-500" />
                    {t.attendance}%
                  </span>
                  <span>
                    <FiStar className="inline mr-1 text-yellow-500" />
                    {t.rating}
                  </span>
                  <span>Upsells: {t.upsells}</span>
                </div>
              </div>
              {t.flagged && <FiFlag className="text-red-500" title="Flagged" />}
            </li>
          ))}
        </ul>
      </div>
      {/* Most Missed Sessions */}
      <div className="rounded-3xl shadow-md p-6 bg-red-50 dark:bg-red-900/20 flex flex-col items-center justify-center">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <FiXCircle className="mr-2 text-red-500" />
          Most Missed Sessions
        </h3>
        <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center border border-red-200 dark:border-red-700 mb-2">
          <FiUser className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <span className="font-medium text-gray-900 dark:text-white">{mostMissed.name}</span>
        <span className="text-xs text-red-700 dark:text-red-400">
          Missed: {mostMissed.missed}
        </span>
      </div>
    </div>
  </section>
);

export default TrainerPerformancePanel;
