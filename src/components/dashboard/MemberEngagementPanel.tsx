import React from "react";
import { FiBarChart2, FiClock, FiUserX, FiSmile } from "react-icons/fi";

/**
 * MemberEngagementPanel displays engagement stats and charts.
 * @returns {JSX.Element}
 */
const mostAttendedClasses = [
  { name: "HIIT Training", count: 45 },
  { name: "Morning Yoga", count: 38 },
  { name: "Pilates", count: 32 },
];
const mostBookedSlots = [
  { slot: "6-7 AM", count: 22 },
  { slot: "7-8 PM", count: 19 },
  { slot: "5-6 PM", count: 17 },
];
const inactiveMembers = [
  { name: "John Doe", days: 15 },
  { name: "Jane Smith", days: 16 },
];
const satisfaction = 87; // percent

const MemberEngagementPanel: React.FC = () => (
  <section className="rounded-3xl shadow-xl p-10 mb-10 bg-white/70 dark:bg-gray-800/70 border border-[#E5E7EB] dark:border-gray-700 backdrop-blur-md bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700">
    <h2 className="text-3xl md:text-4xl font-extrabold mb-10 tracking-tight text-[#111827] dark:text-white">
      Member Engagement
    </h2>
    <div className="flex flex-col gap-10">
      {/* Most Attended Classes */}
      <div className="rounded-3xl shadow-md p-6 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <FiBarChart2 className="mr-2" />
          Most Attended Classes
        </h3>
        <ul className="space-y-2">
          {mostAttendedClasses.map((cls, idx) => (
            <li key={idx} className="flex justify-between items-center">
              <span className="text-gray-900 dark:text-white font-medium">{cls.name}</span>
              <span className="text-xs text-blue-700 dark:text-blue-400">
                {cls.count} sessions
              </span>
            </li>
          ))}
        </ul>
      </div>
      {/* Most Booked Time Slots */}
      <div className="rounded-3xl shadow-md p-6 bg-green-50 dark:bg-green-900/20">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <FiClock className="mr-2" />
          Most Booked Time Slots
        </h3>
        <ul className="space-y-2">
          {mostBookedSlots.map((slot, idx) => (
            <li key={idx} className="flex justify-between items-center">
              <span className="text-gray-900 dark:text-white font-medium">{slot.slot}</span>
              <span className="text-xs text-green-700 dark:text-green-400">
                {slot.count} bookings
              </span>
            </li>
          ))}
        </ul>
      </div>
      {/* Inactive Members */}
      <div className="rounded-3xl shadow-md p-6 bg-yellow-50 dark:bg-yellow-900/20">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <FiUserX className="mr-2" />
          Inactive Members
        </h3>
        <ul className="space-y-2">
          {inactiveMembers.map((m, idx) => (
            <li key={idx} className="flex justify-between items-center">
              <span className="text-gray-900 dark:text-white font-medium">{m.name}</span>
              <span className="text-xs text-yellow-700 dark:text-yellow-400">{m.days} days</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Member Satisfaction */}
      <div className="rounded-3xl shadow-md p-6 bg-purple-50 dark:bg-purple-900/20 flex flex-col items-center justify-center">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <FiSmile className="mr-2" />
          Member Satisfaction
        </h3>
        <div className="relative w-24 h-24 mb-2">
          <svg className="absolute top-0 left-0" width="96" height="96">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#E9D5FF"
              strokeWidth="12"
              fill="none"
              className="dark:stroke-purple-900"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#A78BFA"
              strokeWidth="12"
              fill="none"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - 251.2 * (satisfaction / 100)}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-purple-700 dark:text-purple-400">
            {satisfaction}%
          </span>
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-400">
          from feedback forms/ratings
        </span>
      </div>
    </div>
  </section>
);

export default MemberEngagementPanel;
