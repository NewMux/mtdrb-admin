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
  <section className="rounded-3xl shadow-xl p-10 mb-10 bg-white/70 border border-[#E5E7EB] backdrop-blur-md bg-gradient-to-br from-white via-blue-50 to-blue-100">
    <h2 className="text-3xl md:text-4xl font-extrabold mb-10 tracking-tight text-[#111827]">
      Trainer Performance
    </h2>
    <div className="flex flex-col gap-10">
      {/* Top Trainers */}
      <div className="rounded-3xl shadow-md p-6 bg-green-50">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <FiTrendingUp className="mr-2" />
          Top Trainers
        </h3>
        <ul className="space-y-3">
          {topTrainers.map((t, idx) => (
            <li key={idx} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-green-200">
                <FiUser className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{t.name}</span>
                <div className="flex space-x-2 text-xs text-gray-600">
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
      <div className="rounded-3xl shadow-md p-6 bg-red-50 flex flex-col items-center justify-center">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <FiXCircle className="mr-2 text-red-500" />
          Most Missed Sessions
        </h3>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-red-200 mb-2">
          <FiUser className="h-6 w-6 text-red-600" />
        </div>
        <span className="font-medium text-gray-900">{mostMissed.name}</span>
        <span className="text-xs text-red-700">
          Missed: {mostMissed.missed}
        </span>
      </div>
    </div>
  </section>
);

export default TrainerPerformancePanel;
