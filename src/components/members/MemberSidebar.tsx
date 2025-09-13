import React from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiFlag,
  FiRefreshCw,
  FiUserCheck,
  FiArrowRight,
  FiAlertTriangle,
  FiHash,
} from "react-icons/fi";
import { FaSnowflake } from "react-icons/fa";

interface MemberSidebarProps {
  avatar: string;
  name: string;
  contact: { email?: string; phone?: string };
  status: string;
  tags: string[];
  quickActions: React.ReactNode;
  emergencyContact?: string;
  barcode?: string;
}

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  active: "bg-green-100 text-green-800",
  Trial: "bg-blue-100 text-blue-800",
  trial: "bg-blue-100 text-blue-800",
  Paused: "bg-yellow-100 text-yellow-800",
  paused: "bg-yellow-100 text-yellow-800",
  Cancelled: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-800",
  expired: "bg-red-100 text-red-800",
};

const MemberSidebar: React.FC<MemberSidebarProps> = ({
  avatar,
  name,
  contact,
  status,
  tags,
  quickActions,
  emergencyContact,
  barcode,
}) => {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";

  return (
    <aside className="sticky top-0 p-6 w-80 bg-white rounded-3xl shadow-xl flex flex-col items-center space-y-8 border-r border-gray-100 min-h-full">
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-5xl text-blue-400 mb-2">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <FiUser />
        )}
      </div>
      {/* Name & Status */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{name}</h2>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
        >
          <FiCheckCircle className="mr-1" />
          {status || "Unknown"}
        </span>
      </div>
      {/* Contact Info */}
      <div className="w-full space-y-2">
        {contact.email && (
          <div className="flex items-center text-gray-500 text-sm">
            <FiMail className="mr-2" /> {contact.email}
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center text-gray-500 text-sm">
            <FiPhone className="mr-2" /> {contact.phone}
          </div>
        )}
      </div>
      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {/* Quick Actions */}
      <div className="w-full flex flex-col gap-3 mt-2">
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition">
          <FiRefreshCw /> Extend Plan
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition">
          <FaSnowflake /> Freeze Plan
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition">
          <FiUserCheck /> Reassign Trainer
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold transition">
          <FiFlag /> Flag Member
        </button>
      </div>
      {/* Emergency Contact */}
      {emergencyContact && (
        <div className="w-full flex items-center justify-center gap-2 mt-4 text-sm text-orange-600 bg-orange-50 rounded-xl py-2">
          <FiAlertTriangle /> Emergency: {emergencyContact}
        </div>
      )}
      {/* Barcode/QR */}
      {barcode && (
        <div className="w-full flex flex-col items-center mt-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <FiHash /> Member ID
          </div>
          <div className="font-mono text-lg text-gray-700 tracking-widest mt-1">
            {barcode}
          </div>
        </div>
      )}
    </aside>
  );
};

export default MemberSidebar;
