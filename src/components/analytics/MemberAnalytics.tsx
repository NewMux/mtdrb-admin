import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiTrendingUp,
  FiBarChart,
  FiPieChart,
  FiClock,
  FiDollarSign,
  FiUserX,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

type ActiveTab = "overview" | "performance" | "engagement";

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
        {ltvTrend.slice(-3).map((data) => (
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
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
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
  ];

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
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
