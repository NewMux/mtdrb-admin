import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart,
  FiPieChart,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiClock,
  FiDollarSign,
  FiUserCheck,
  FiUserX,
  FiUserMinus,
  FiUserPlus,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

interface MemberFunnel {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface MemberStatus {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface TopMember {
  name: string;
  email: string;
  spend: number;
  joinDate: string;
  status: string;
  avatar?: string;
}

interface MemberAnalyticsProps {
  funnel: MemberFunnel[];
  memberStatus: MemberStatus[];
  topSpenders: TopMember[];
  longestMembers: TopMember[];
  ltvTrend: { month: string; ltv: number }[];
  noShows: { name: string; count: number; lastSeen: string }[];
}

const FunnelChart = ({ funnel }: { funnel: MemberFunnel[] }) => {
  // Add null/undefined check
  if (!funnel || !Array.isArray(funnel)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiBarChart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Member Funnel
            </h3>
            <p className="text-sm text-gray-600">Conversion stages overview</p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 mb-2">📊</div>
            <p className="text-gray-500 text-sm">No data available</p>
            <p className="text-gray-400 text-xs">Loading funnel data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FiBarChart className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Member Funnel</h3>
          <p className="text-sm text-gray-600">Conversion stages overview</p>
        </div>
      </div>

      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-4xl text-gray-300 mb-2">📊</div>
          <p className="text-gray-500 text-sm">Bar Chart</p>
          <p className="text-gray-400 text-xs">Chart.js integration</p>
        </div>
      </div>

      <div className="space-y-3">
        {funnel.map((stage, index) => (
          <motion.div
            key={stage.stage}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${stage.color}`} />
              <div>
                <p className="font-medium text-gray-900">{stage.stage}</p>
                <p className="text-sm text-gray-600">{stage.count} members</p>
              </div>
            </div>
            <span className="font-bold text-gray-900">{stage.percentage}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StatusPieChart = ({ memberStatus }: { memberStatus: MemberStatus[] }) => {
  // Add null/undefined check
  if (!memberStatus || !Array.isArray(memberStatus)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <FiPieChart className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Member Status
            </h3>
            <p className="text-sm text-gray-600">
              Current membership distribution
            </p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 mb-2">📊</div>
            <p className="text-gray-500 text-sm">No data available</p>
            <p className="text-gray-400 text-xs">Loading member status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <FiPieChart className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Member Status</h3>
          <p className="text-sm text-gray-600">
            Current membership distribution
          </p>
        </div>
      </div>

      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-4xl text-gray-300 mb-2">🥧</div>
          <p className="text-gray-500 text-sm">Pie Chart</p>
          <p className="text-gray-400 text-xs">Chart.js integration</p>
        </div>
      </div>

      <div className="space-y-3">
        {memberStatus.map((status, index) => (
          <motion.div
            key={status.status}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <div>
                <p className="font-medium text-gray-900">{status.status}</p>
                <p className="text-sm text-gray-600">{status.count} members</p>
              </div>
            </div>
            <span className="font-bold text-gray-900">
              {status.percentage}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MembersTable = ({
  title,
  members,
  icon,
  iconColor,
}: {
  title: string;
  members: TopMember[];
  icon: React.ReactNode;
  iconColor: string;
}) => {
  // Add null/undefined check
  if (!members || !Array.isArray(members)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Top performing members</p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 mb-2">👥</div>
            <p className="text-gray-500 text-sm">No data available</p>
            <p className="text-gray-400 text-xs">Loading member data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">Top performing members</p>
        </div>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <motion.div
            key={member.email}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">
                {title.includes("Spenders")
                  ? `$${member.spend.toLocaleString()}`
                  : member.joinDate}
              </p>
              <p className="text-sm text-gray-600">
                {title.includes("Spenders") ? "Total Spend" : "Member Since"}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <SmartButton variant="secondary" size="sm" className="w-full">
          View Details
        </SmartButton>
      </div>
    </div>
  );
};

const NoShowsTable = ({
  noShows,
}: {
  noShows: MemberAnalyticsProps["noShows"];
}) => {
  // Add null/undefined check
  if (!noShows || !Array.isArray(noShows)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <FiUserX className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              No-Show Members
            </h3>
            <p className="text-sm text-gray-600">Members who need attention</p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 mb-2">👥</div>
            <p className="text-gray-500 text-sm">No data available</p>
            <p className="text-gray-400 text-xs">Loading no-show data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <FiUserX className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            No-Show Members
          </h3>
          <p className="text-sm text-gray-600">Members who need attention</p>
        </div>
      </div>

      <div className="space-y-3">
        {noShows.map((member, index) => (
          <motion.div
            key={member.name}
            className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiUserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-red-600">{member.count} no-shows</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Last seen</p>
              <p className="font-medium text-gray-900">{member.lastSeen}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <SmartButton variant="primary" size="sm" className="w-full">
          View Details
        </SmartButton>
      </div>
    </div>
  );
};

const LTVTrendChart = ({
  ltvTrend,
}: {
  ltvTrend: MemberAnalyticsProps["ltvTrend"];
}) => {
  // Add null/undefined check
  if (!ltvTrend || !Array.isArray(ltvTrend)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiDollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Lifetime Value Trend
            </h3>
            <p className="text-sm text-gray-600">
              Average member value over time
            </p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 mb-2">📈</div>
            <p className="text-gray-500 text-sm">No data available</p>
            <p className="text-gray-400 text-xs">Loading LTV data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <FiDollarSign className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Lifetime Value Trend
          </h3>
          <p className="text-sm text-gray-600">
            Average member value over time
          </p>
        </div>
      </div>

      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-4xl text-gray-300 mb-2">📈</div>
          <p className="text-gray-500 text-sm">Line Chart</p>
          <p className="text-gray-400 text-xs">Chart.js integration</p>
        </div>
      </div>

      <div className="space-y-2">
        {ltvTrend.slice(-3).map((data, index) => (
          <div
            key={data.month}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-600">{data.month}</span>
            <span className="font-medium text-gray-900">
              ${data.ltv.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MemberAnalytics({
  funnel,
  memberStatus,
  topSpenders,
  longestMembers,
  ltvTrend,
  noShows,
}: MemberAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "engagement"
  >("overview");

  // Handler for exporting member data
  const handleExportData = () => {
    // TODO: Implement actual export functionality
  };

  // Handler for member campaign
  const handleMemberCampaign = () => {
    // TODO: Implement member campaign functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Analytics</h2>
          <p className="text-gray-600">
            Understand your member behavior and value
          </p>
        </div>
        {/* Remove Export Data and Member Campaign buttons from MemberAnalytics header */}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          {
            id: "overview",
            label: "Overview",
            icon: <FiBarChart className="w-4 h-4" />,
          },
          {
            id: "performance",
            label: "Performance",
            icon: <FiTrendingUp className="w-4 h-4" />,
          },
          {
            id: "engagement",
            label: "Engagement",
            icon: <FiUsers className="w-4 h-4" />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart funnel={funnel} />
          <StatusPieChart memberStatus={memberStatus} />
        </div>
      )}

      {activeTab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MembersTable
            title="Top Spenders"
            members={topSpenders}
            icon={<FiDollarSign className="w-6 h-6 text-green-600" />}
            iconColor="bg-green-100"
          />
          <MembersTable
            title="Longest Members"
            members={longestMembers}
            icon={<FiClock className="w-6 h-6 text-blue-600" />}
            iconColor="bg-blue-100"
          />
        </div>
      )}

      {activeTab === "engagement" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NoShowsTable noShows={noShows} />
          <LTVTrendChart ltvTrend={ltvTrend} />
        </div>
      )}
    </div>
  );
}

// Default data for demonstration
export const defaultMemberData: MemberAnalyticsProps = {
  funnel: [
    { stage: "Leads", count: 1000, percentage: 100, color: "bg-blue-500" },
    { stage: "Trials", count: 300, percentage: 30, color: "bg-green-500" },
    { stage: "Paid", count: 180, percentage: 18, color: "bg-yellow-500" },
    { stage: "Retained", count: 150, percentage: 15, color: "bg-purple-500" },
  ],
  memberStatus: [
    { status: "Active", count: 1247, percentage: 65, color: "#10B981" },
    { status: "Trial", count: 89, percentage: 5, color: "#F59E0B" },
    { status: "Frozen", count: 156, percentage: 8, color: "#EF4444" },
    { status: "At-Risk", count: 18, percentage: 1, color: "#DC2626" },
    { status: "Expired", count: 420, percentage: 22, color: "#6B7280" },
  ],
  topSpenders: [
    {
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      spend: 8500,
      joinDate: "2023-01-15",
      status: "Active",
    },
    {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      spend: 7200,
      joinDate: "2023-03-22",
      status: "Active",
    },
    {
      name: "Mike Chen",
      email: "mike@example.com",
      spend: 6800,
      joinDate: "2023-02-10",
      status: "Active",
    },
    {
      name: "Lisa Ahmed",
      email: "lisa@example.com",
      spend: 5900,
      joinDate: "2023-04-05",
      status: "Active",
    },
    {
      name: "David Wilson",
      email: "david@example.com",
      spend: 5200,
      joinDate: "2023-01-30",
      status: "Active",
    },
  ],
  longestMembers: [
    {
      name: "Fatima Ali",
      email: "fatima@example.com",
      spend: 4500,
      joinDate: "2020-06-15",
      status: "Active",
    },
    {
      name: "Omar Khalil",
      email: "omar@example.com",
      spend: 3800,
      joinDate: "2020-08-22",
      status: "Active",
    },
    {
      name: "Nour Hassan",
      email: "nour@example.com",
      spend: 4200,
      joinDate: "2020-09-10",
      status: "Active",
    },
    {
      name: "Yara Ahmed",
      email: "yara@example.com",
      spend: 3600,
      joinDate: "2020-11-05",
      status: "Active",
    },
    {
      name: "Zainab Ali",
      email: "zainab@example.com",
      spend: 3900,
      joinDate: "2021-01-20",
      status: "Active",
    },
  ],
  ltvTrend: [
    { month: "Jan", ltv: 450 },
    { month: "Feb", ltv: 480 },
    { month: "Mar", ltv: 520 },
    { month: "Apr", ltv: 490 },
    { month: "May", ltv: 550 },
    { month: "Jun", ltv: 580 },
  ],
  noShows: [
    { name: "Ahmed Hassan", count: 5, lastSeen: "2 weeks ago" },
    { name: "Sarah Johnson", count: 3, lastSeen: "1 week ago" },
    { name: "Mike Chen", count: 4, lastSeen: "3 weeks ago" },
    { name: "Lisa Ahmed", count: 2, lastSeen: "1 week ago" },
    { name: "David Wilson", count: 6, lastSeen: "4 weeks ago" },
  ],
};
