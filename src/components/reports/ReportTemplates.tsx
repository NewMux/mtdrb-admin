import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiBarChart,
  FiZap,
} from "react-icons/fi";
// Removed import from mockReports - define types locally
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  popularity?: number;
  color?: string;
}

const getReportTemplates = async (): Promise<ReportTemplate[]> => {
  // TODO: Fetch from Supabase
  return [];
};
import { toast } from "react-hot-toast";

interface ReportTemplatesProps {
  onTemplateSelect: (template: ReportTemplate) => void;
  isPro?: boolean;
}

const getCategoryIcon = (category: ReportTemplate["category"]) => {
  switch (category) {
    case "trainer":
      return FiUsers;
    case "financial":
      return FiDollarSign;
    case "operational":
      return FiBarChart;
    case "member":
      return FiTrendingUp;
    default:
      return FiFileText;
  }
};

const getColorClasses = (color: string) => {
  const colorMap: Record<
    string,
    { bg: string; text: string; border: string; gradient: string }
  > = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-200",
      gradient: "from-blue-50 to-blue-100",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      border: "border-green-200",
      gradient: "from-green-50 to-green-100",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      border: "border-purple-200",
      gradient: "from-purple-50 to-purple-100",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      border: "border-orange-200",
      gradient: "from-orange-50 to-orange-100",
    },
  };
  return colorMap[color] || colorMap.blue;
};

export default function ReportTemplates({
  onTemplateSelect,
  isPro = false,
}: ReportTemplatesProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getReportTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load report templates");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: ReportTemplate) => {
    const popularity = template.popularity ?? 0;
    if (!isPro && popularity > 80) {
      toast.error("This template requires a Pro subscription");
      return;
    }
    onTemplateSelect(template);
    toast.success(`Selected ${template.name} template`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Report Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
            >
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Smart Report Templates
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FiZap className="w-4 h-4" />
          Smart-optimized
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template, index) => {
          const Icon = getCategoryIcon(template.category);
          const colors = getColorClasses(template.color ?? "blue");
          const popularity = template.popularity ?? 0;
          const isLocked = !isPro && popularity > 80;

          return (
            <motion.div
              key={template.id}
              variants={cardVariants}
              className={`bg-white rounded-2xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                isLocked ? "opacity-60" : ""
              }`}
              onClick={() => handleTemplateClick(template)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                {isLocked && (
                  <div className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    Pro
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {template.popularity}% popular
                  </div>
                  <div className="text-2xl">{template.icon}</div>
                </div>
              </div>

              <button
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isLocked
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : `bg-gradient-to-r ${colors.gradient} ${colors.text} hover:shadow-md`
                }`}
                disabled={isLocked}
              >
                {isLocked ? "Upgrade to Pro" : "Generate Report"}
              </button>
            </motion.div>
          );
        })}
      </div>

      {!isPro && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔒</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Unlock Premium Templates
              </h3>
              <p className="text-gray-600 text-sm">
                Get access to advanced report templates and custom analytics
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
