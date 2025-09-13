import React from "react";
import { Member } from "../../../types";
import {
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiZap,
  FiMessageCircle,
  FiFileText,
} from "react-icons/fi";

interface OverviewTabProps {
  member: Member;
  plan: any;
  activity: {
    lastCheckIn?: string;
    attendanceThisMonth?: number;
    lowActivity?: boolean;
  };
  payment: {
    lastPayment?: string;
    status?: string;
    invoice?: any;
  };
  whatsapp: {
    lastMessage?: string;
    nextScheduled?: string | null;
  };
}

const getDaysLeft = (endDate?: string | null) => {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff;
};

const OverviewTab: React.FC<OverviewTabProps> = ({
  member,
  plan,
  activity,
  payment,
  whatsapp,
}) => {
  const daysLeft = getDaysLeft(
    plan?.end_date || member.end_date || member.planEnd,
  );
  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      {/* Membership Plan Card */}
      <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FiFileText className="text-blue-400" />
            <span className="font-semibold text-gray-900 text-lg">
              {plan?.name || member.membership_type || "Membership Plan"}
            </span>
          </div>
          <div className="text-gray-500 text-sm">
            Start: {plan?.start_date || member.start_date || "-"}
          </div>
          <div className="text-gray-500 text-sm">
            End: {plan?.end_date || member.end_date || "-"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-green-500" />
            <span className="font-semibold text-green-700 text-lg">
              {plan?.price || member.membership_price || "-"}{" "}
              {plan?.currency || "BHD"}
            </span>
          </div>
          {daysLeft !== null && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mt-1">
              <FiClock className="mr-1" /> {daysLeft} days left
            </span>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center">
          <FiCalendar className="text-blue-400 text-2xl mb-1" />
          <div className="font-semibold text-gray-900">
            {activity.lastCheckIn
              ? new Date(activity.lastCheckIn).toLocaleDateString()
              : "-"}
          </div>
          <div className="text-xs text-gray-500">Last Check-in</div>
        </div>
        <div className="flex flex-col items-center">
          <FiCheckCircle className="text-green-400 text-2xl mb-1" />
          <div className="font-semibold text-gray-900">
            {activity.attendanceThisMonth ?? "-"}
          </div>
          <div className="text-xs text-gray-500">Attendance This Month</div>
        </div>
        <div className="flex flex-col items-center">
          {activity.lowActivity ? (
            <>
              <FiAlertTriangle className="text-red-400 text-2xl mb-1" />
              <div className="font-semibold text-red-600">Low</div>
              <div className="text-xs text-red-500">Low Activity</div>
            </>
          ) : (
            <>
              <FiZap className="text-yellow-400 text-2xl mb-1" />
              <div className="font-semibold text-gray-900">Normal</div>
              <div className="text-xs text-gray-500">Activity</div>
            </>
          )}
        </div>
      </div>

      {/* Payment & WhatsApp CRM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <FiDollarSign className="text-green-400" />
            <span className="font-semibold text-gray-900">Last Payment</span>
          </div>
          <div className="text-gray-700 text-sm">
            {payment.lastPayment
              ? new Date(payment.lastPayment).toLocaleDateString()
              : "-"}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${payment.status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              {payment.status || "Unknown"}
            </span>
            {payment.invoice && (
              <button className="ml-2 text-blue-500 hover:underline text-xs flex items-center gap-1">
                <FiFileText /> View Invoice
              </button>
            )}
          </div>
        </div>
        {/* WhatsApp CRM */}
        <div className="bg-white rounded-3xl shadow border border-gray-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <FiMessageCircle className="text-green-400" />
            <span className="font-semibold text-gray-900">WhatsApp CRM</span>
          </div>
          <div className="text-gray-700 text-sm">
            Last Message:{" "}
            {whatsapp.lastMessage
              ? new Date(whatsapp.lastMessage).toLocaleDateString()
              : "-"}
          </div>
          <div className="text-gray-700 text-sm">
            Next Scheduled:{" "}
            {whatsapp.nextScheduled
              ? new Date(whatsapp.nextScheduled).toLocaleDateString()
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
