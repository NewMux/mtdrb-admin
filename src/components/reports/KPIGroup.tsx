import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiDownload,
  FiCalendar,
  FiZap,
  FiTrendingUp,
  FiTrendingDown,
  FiMoreVertical,
} from "react-icons/fi";
// Removed import from mockReports - define types locally
interface KPIStats {
  revenue: { value: number; change: number };
  members: { value: number; change: number };
  classes: { value: number; change: number };
  attendance: { value: number; change: number };
}

const getKPIStats = async (): Promise<KPIStats> => {
  // TODO: Fetch from Supabase
  return {
    revenue: { value: 0, change: 0 },
    members: { value: 0, change: 0 },
    classes: { value: 0, change: 0 },
    attendance: { value: 0, change: 0 },
  };
};
import { toast } from "react-hot-toast";

interface KPIGroupProps {
  isPro?: boolean;
}

const KPICard = ({
  title,
  value,
  trend,
  icon: Icon,
  color,
  isLoading = false,
}: {
  title: string;
  value: number;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isLoading?: boolean;
}) => {
  const isPositive = trend.startsWith("+");
  const TrendIcon = isPositive ? FiTrendingUp : FiTrendingDown;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="relative group">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiMoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="p-2">
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                <FiDownload className="w-4 h-4" />
                Export as PDF
              </button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                <FiDownload className="w-4 h-4" />
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon
            className={`w-4 h-4 ${isPositive ? "text-green-500" : "text-red-500"}`}
          />
          <span
            className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {trend}
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-600">{title}</div>
    </motion.div>
  );
};

export default function KPIGroup({ isPro = false }: KPIGroupProps) {
  const [kpiStats, setKpiStats] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIStats();
  }, []);

  const fetchKPIStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await getKPIStats();
      setKpiStats(stats);
    } catch (err) {
      setError("Failed to load KPI data");
      toast.error("Failed to load KPI data");
    } finally {
      setLoading(false);
    }
  };

  const kpiData = [
    {
      title: "Generated Reports",
      value: kpiStats?.generatedReports.value || 0,
      trend: kpiStats?.generatedReports.trend || "+0%",
      icon: FiFileText,
      color: "blue",
    },
    {
      title: "Downloads",
      value: kpiStats?.downloads.value || 0,
      trend: kpiStats?.downloads.trend || "+0%",
      icon: FiDownload,
      color: "green",
    },
    {
      title: "Scheduled Reports",
      value: kpiStats?.scheduledReports.value || 0,
      trend: kpiStats?.scheduledReports.trend || "+0",
      icon: FiCalendar,
      color: "purple",
    },
    {
      title: "Auto Reports",
      value: kpiStats?.autoReports.value || 0,
      trend: kpiStats?.autoReports.trend || "+0",
      icon: FiZap,
      color: "orange",
    },
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="text-red-500">⚠️</div>
          <div>
            <h3 className="font-semibold text-red-900">
              Failed to load KPI data
            </h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchKPIStats}
            className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Key Performance Indicators
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Real-time data
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            trend={kpi.trend}
            icon={kpi.icon}
            color={kpi.color}
            isLoading={loading}
          />
        ))}
      </div>

      {!isPro && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔒</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 text-sm">
                Get detailed breakdowns and custom metrics
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
