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
import { useRTL } from "../../hooks/useRTL";
import { useTranslation } from "react-i18next";

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
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  // Add null/undefined check
  if (!funnel || !Array.isArray(funnel)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiBarChart className="w-6 h-6 text-blue-600" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("analytics.memberFunnel")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.conversionStagesOverview")}</p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">📊</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.noData")}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.loadingFunnelData")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
        <div className="p-2 bg-blue-100 rounded-lg">
          <FiBarChart className="w-6 h-6 text-blue-600" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("analytics.memberFunnel")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.conversionStagesOverview")}</p>
        </div>
      </div>

      <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">📊</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.barChart")}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.chartIntegration")}</p>
        </div>
      </div>

      <div className="space-y-3">
        {funnel.map((stage, index) => (
          <motion.div
            key={stage.stage}
            className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg`}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
              <div className={`w-4 h-4 rounded-full ${stage.color}`} />
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-medium text-gray-900 dark:text-white">{stage.stage}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.membersCount", { count: stage.count })}</p>
              </div>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{stage.percentage}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StatusPieChart = ({ memberStatus }: { memberStatus: MemberStatus[] }) => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  // Add null/undefined check
  if (!memberStatus || !Array.isArray(memberStatus)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
          <div className="p-2 bg-green-100 rounded-lg">
            <FiPieChart className="w-6 h-6 text-green-600" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("analytics.memberStatusTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("analytics.currentMembershipDistribution")}
            </p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">📊</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.noData")}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.loadingMemberStatus")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
        <div className="p-2 bg-green-100 rounded-lg">
          <FiPieChart className="w-6 h-6 text-green-600" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("analytics.memberStatusTitle")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("analytics.currentMembershipDistribution")}
          </p>
        </div>
      </div>

      <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">🥧</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.pieChart")}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.chartIntegration")}</p>
        </div>
      </div>

      <div className="space-y-3">
        {memberStatus.map((status, index) => (
          <motion.div
            key={status.status}
            className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-medium text-gray-900 dark:text-white">{status.status}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.membersCount", { count: status.count })}</p>
              </div>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
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
  variant,
}: {
  title: string;
  members: TopMember[];
  icon: React.ReactNode;
  iconColor: string;
  variant: "spenders" | "longest";
}) => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  // Add null/undefined check
  if (!members || !Array.isArray(members)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
          <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.topPerformingMembers")}</p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">👥</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.noData")}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.loadingMemberData")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
        <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.topPerformingMembers")}</p>
        </div>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <motion.div
            key={member.email}
            className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg`}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                )}
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
              </div>
            </div>
            <div className={isRTL ? 'text-left' : 'text-right'}>
              <p className="font-bold text-gray-900 dark:text-white">
                {variant === "spenders"
                  ? `$${member.spend.toLocaleString()}`
                  : member.joinDate}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {variant === "spenders" ? t("analytics.totalSpend") : t("analytics.memberSince")}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <SmartButton variant="secondary" size="sm" className="w-full">
          {t("analytics.viewDetails")}
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
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  // Add null/undefined check
  if (!noShows || !Array.isArray(noShows)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
          <div className="p-2 bg-red-100 rounded-lg">
            <FiUserX className="w-6 h-6 text-red-600" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("analytics.noShowMembers")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.membersNeedAttention")}</p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">👥</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.noData")}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.loadingNoShowData")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
        <div className="p-2 bg-red-100 rounded-lg">
          <FiUserX className="w-6 h-6 text-red-600" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("analytics.noShowMembers")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.membersNeedAttention")}</p>
        </div>
      </div>

      <div className="space-y-3">
        {noShows.map((member, index) => (
          <motion.div
            key={member.name}
            className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800`}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <FiUserX className="w-5 h-5 text-red-600" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{t("analytics.noShowsCount", { count: member.count })}</p>
              </div>
            </div>
            <div className={isRTL ? 'text-left' : 'text-right'}>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("analytics.lastSeen")}</p>
              <p className="font-medium text-gray-900 dark:text-white">{member.lastSeen}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <SmartButton variant="primary" size="sm" className="w-full">
          {t("analytics.viewDetails")}
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
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  // Add null/undefined check
  if (!ltvTrend || !Array.isArray(ltvTrend)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiDollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("analytics.lifetimeValueTrend")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("analytics.avgMemberValueOverTime")}
            </p>
          </div>
        </div>

        <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">📈</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.noData")}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.loadingLtvData")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3 mb-6`}>
        <div className="p-2 bg-purple-100 rounded-lg">
          <FiDollarSign className="w-6 h-6 text-purple-600" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("analytics.lifetimeValueTrend")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("analytics.avgMemberValueOverTime")}
          </p>
        </div>
      </div>

      <div className="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-4xl text-gray-300 dark:text-gray-600 mb-2">📈</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("analytics.lineChart")}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{t("analytics.chartIntegration")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {ltvTrend.slice(-3).map((data) => (
          <div
            key={data.month}
            className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between text-sm`}
          >
            <span className="text-gray-600 dark:text-gray-400">{data.month}</span>
            <span className="font-medium text-gray-900 dark:text-white">
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
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: t("analytics.overview"),
      icon: <FiBarChart className="w-4 h-4" />,
    },
    {
      id: "performance",
      label: t("analytics.performance"),
      icon: <FiTrendingUp className="w-4 h-4" />,
    },
    {
      id: "engagement",
      label: t("analytics.engagement"),
      icon: <FiUsers className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("analytics.memberAnalyticsTitle")}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("analytics.memberAnalyticsSubtitle")}
          </p>
        </div>
        {/* Remove Export Data and Member Campaign buttons from MemberAnalytics header */}
      </div>

      {/* Tabs */}
      <div className={`flex ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
            title={t("analytics.topSpenders")}
            members={topSpenders}
            icon={<FiDollarSign className="w-6 h-6 text-green-600" />}
            iconColor="bg-green-100"
            variant="spenders"
          />
          <MembersTable
            title={t("analytics.longestMembers")}
            members={longestMembers}
            icon={<FiClock className="w-6 h-6 text-blue-600" />}
            iconColor="bg-blue-100"
            variant="longest"
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
