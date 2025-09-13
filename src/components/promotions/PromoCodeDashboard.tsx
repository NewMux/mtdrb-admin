import React, { useState, useEffect } from "react";
import {
  FiGift,
  FiPercent,
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiEye,
  FiEdit,
  FiCopy,
  FiCheck,
  FiX,
  FiPlus,
  FiBarChart,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface PromoCode {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: number;
  maxUses: number;
  usedCount: number;
  status: "active" | "expired" | "scheduled" | "inactive";
  expiryDate: string;
  createdAt: string;
  revenue: number;
  conversionRate: number;
  targetSegment?: string;
  description?: string;
}

interface PromoCodeDashboardProps {
  onEditPromoCode: (promoCode: PromoCode) => void;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "green":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "yellow":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "red":
        return "bg-red-50 text-red-600 border-red-200";
      case "purple":
        return "bg-violet-50 text-violet-600 border-violet-200";
      case "orange":
        return "bg-orange-50 text-orange-600 border-orange-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-emerald-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${getColorClasses(color)}`}>
          {icon}
        </div>
        <div
          className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor(trend)}`}
        >
          {trend === "up" && <FiTrendingUp className="h-4 w-4" />}
          {trend === "down" && <FiTrendingDown className="h-4 w-4" />}
          <span>{trendValue}</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

const PromoCodeCard: React.FC<{
  promoCode: PromoCode;
  onEdit: (promoCode: PromoCode) => void;
}> = ({ promoCode, onEdit }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUsagePercentage = () => {
    return Math.round((promoCode.usedCount / promoCode.maxUses) * 100);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(promoCode.code);
    toast.success("Promo code copied to clipboard!");
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900 font-mono">
              {promoCode.code}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promoCode.status)}`}
            >
              {promoCode.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            {promoCode.description || "No description"}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Discount</p>
              <p className="font-semibold text-gray-900">
                {promoCode.type === "percentage"
                  ? `${promoCode.value}%`
                  : `$${promoCode.value}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Usage</p>
              <p className="font-semibold text-gray-900">
                {promoCode.usedCount}/{promoCode.maxUses}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Usage Progress</span>
              <span>{getUsagePercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getUsagePercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Revenue</p>
              <p className="font-semibold text-green-600">
                ${promoCode.revenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Conversion</p>
              <p className="font-semibold text-blue-600">
                {promoCode.conversionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy code"
          >
            <FiCopy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(promoCode)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit code"
          >
            <FiEdit className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Expires: {new Date(promoCode.expiryDate).toLocaleDateString()}
        </span>
        <span>
          Created: {new Date(promoCode.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

const PromoCodeDashboard: React.FC<PromoCodeDashboardProps> = ({
  onEditPromoCode,
}) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockPromoCodes: PromoCode[] = [
      {
        id: "1",
        code: "NEWYEAR2024",
        type: "percentage",
        value: 20,
        maxUses: 100,
        usedCount: 67,
        status: "active",
        expiryDate: "2024-02-29",
        createdAt: "2024-01-01",
        revenue: 4450,
        conversionRate: 24.5,
        description: "New Year fitness challenge discount",
      },
      {
        id: "2",
        code: "FRIEND50",
        type: "flat",
        value: 50,
        maxUses: 50,
        usedCount: 23,
        status: "active",
        expiryDate: "2024-03-15",
        createdAt: "2024-01-15",
        revenue: 3350,
        conversionRate: 18.2,
        description: "Friend referral bonus",
      },
      {
        id: "3",
        code: "STUDENT25",
        type: "percentage",
        value: 25,
        maxUses: 200,
        usedCount: 34,
        status: "active",
        expiryDate: "2024-06-30",
        createdAt: "2024-01-10",
        revenue: 1700,
        conversionRate: 12.8,
        description: "Student discount program",
      },
      {
        id: "4",
        code: "HOLIDAY30",
        type: "percentage",
        value: 30,
        maxUses: 75,
        usedCount: 75,
        status: "expired",
        expiryDate: "2024-01-31",
        createdAt: "2023-12-01",
        revenue: 2250,
        conversionRate: 31.5,
        description: "Holiday season special",
      },
    ];

    setPromoCodes(mockPromoCodes);
    setLoading(false);
  }, []);

  const kpis = [
    {
      title: "Active Codes",
      value: promoCodes.filter((c) => c.status === "active").length.toString(),
      subtitle: "Currently running",
      icon: <FiGift className="h-6 w-6 text-purple-600" />,
      trend: "up" as const,
      trendValue: "+2",
      color: "purple",
    },
    {
      title: "Total Revenue",
      value: `$${promoCodes.reduce((sum, code) => sum + code.revenue, 0).toLocaleString()}`,
      subtitle: "From all codes",
      icon: <FiDollarSign className="h-6 w-6 text-green-600" />,
      trend: "up" as const,
      trendValue: "+18%",
      color: "green",
    },
    {
      title: "Avg Conversion",
      value: `${Math.round(promoCodes.reduce((sum, code) => sum + code.conversionRate, 0) / promoCodes.length)}%`,
      subtitle: "Across all codes",
      icon: <FiPercent className="h-6 w-6 text-blue-600" />,
      trend: "up" as const,
      trendValue: "+3.2%",
      color: "blue",
    },
    {
      title: "Total Uses",
      value: promoCodes
        .reduce((sum, code) => sum + code.usedCount, 0)
        .toString(),
      subtitle: "All time",
      icon: <FiUsers className="h-6 w-6 text-orange-600" />,
      trend: "up" as const,
      trendValue: "+12%",
      color: "orange",
    },
  ];

  const activeCodes = promoCodes.filter((code) => code.status === "active");
  const expiredCodes = promoCodes.filter((code) => code.status === "expired");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-colors text-left">
            <FiPlus className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Create New Code</h3>
            <p className="text-sm text-gray-600">Generate discount code</p>
          </button>
          <button className="p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors text-left">
            <FiBarChart className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">View Analytics</h3>
            <p className="text-sm text-gray-600">Performance insights</p>
          </button>
          <button className="p-4 bg-green-50 rounded-2xl hover:bg-green-100 transition-colors text-left">
            <FiUsers className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Manage Codes</h3>
            <p className="text-sm text-gray-600">Edit or deactivate</p>
          </button>
        </div>
      </div>

      {/* Active Promo Codes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Active Promo Codes
          </h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {activeCodes.length} Active
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeCodes.map((promoCode) => (
            <PromoCodeCard
              key={promoCode.id}
              promoCode={promoCode}
              onEdit={onEditPromoCode}
            />
          ))}
        </div>
      </div>

      {/* Recent Expired Codes */}
      {expiredCodes.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Recently Expired
            </h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {expiredCodes.length} Expired
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expiredCodes.slice(0, 2).map((promoCode) => (
              <PromoCodeCard
                key={promoCode.id}
                promoCode={promoCode}
                onEdit={onEditPromoCode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeDashboard;
export { PromoCodeDashboard };
