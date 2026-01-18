import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiZap,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

interface Insight {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impact: string;
  action: string;
  category: string;
}

interface SmartInsightsProps {
  insights: Insight[];
  onActionClick: (id: string, action: string) => void;
}

const InsightCard = ({
  insight,
  onActionClick,
}: {
  insight: Insight;
  onActionClick: (id: string, action: string) => void;
}) => {
  const getPriorityColor = () => {
    switch (insight.priority) {
      case "high":
        return "border-red-500";
      case "medium":
        return "border-orange-500";
      case "low":
        return "border-emerald-500";
      default:
        return "border-gray-500";
    }
  };

  const getIcon = () => {
    switch (insight.category) {
      case "revenue":
        return <FiZap className="w-6 h-6 text-emerald-600" />;
      case "members":
        return <FiCheckCircle className="w-6 h-6 text-blue-600" />;
      case "operations":
        return <FiAlertCircle className="w-6 h-6 text-orange-600" />;
      default:
        return <FiZap className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPriorityBadgeColor = () => {
    switch (insight.priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "low":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 ${getPriorityColor()} hover:shadow-md transition-all duration-300 ease-in-out`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gray-50">{getIcon()}</div>
          <div>
            <h3 className="font-semibold text-gray-900 tracking-tight">
              {insight.title}
            </h3>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeColor()}`}
        >
          {insight.priority}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{insight.impact}</span>
        <SmartButton
          onClick={() => onActionClick(insight.id, insight.action)}
          variant="primary"
          size="sm"
          className="text-xs"
        >
          {insight.action}
          <FiTrendingUp className="w-3 h-3 ml-1" />
        </SmartButton>
      </div>
    </motion.div>
  );
};

const AskAssistantModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => void;
}) => {
  const [question, setQuestion] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiZap className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Ask Smart Assistant
          </h2>
        </div>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your gym analytics... e.g., 'Why did revenue drop last week?'"
          className="w-full p-4 border border-gray-300 rounded-xl resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="flex gap-3 mt-6">
          <SmartButton onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </SmartButton>
          <SmartButton
            onClick={() => {
              onSubmit(question);
              setQuestion("");
              onClose();
            }}
            variant="primary"
            className="flex-1"
            disabled={!question.trim()}
          >
            Ask Assistant
          </SmartButton>
        </div>
      </motion.div>
    </div>
  );
};

export default function SmartInsights({
  insights,
  onActionClick,
}: SmartInsightsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAskAssistant = async (question: string) => {
    try {
      void question;
      // TODO: Implement real assistant API call when backend is ready
      // Placeholder for future implementation
    } catch (error) {
      console.error("Error asking assistant:", error);
    }
  };

  // Add null/undefined check
  if (!insights || !Array.isArray(insights)) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiZap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Insights That Matter
              </h2>
              <p className="text-sm text-gray-600">
                Smart-powered recommendations for your business
              </p>
            </div>
          </div>
          <SmartButton
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<FiZap className="w-4 h-4" />}
          >
            Ask Assistant
          </SmartButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-4 animate-pulse"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-48 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                <div className="w-24 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <AskAssistantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAskAssistant}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiZap className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Insights That Matter
            </h2>
            <p className="text-sm text-gray-600">
              Smart-powered recommendations for your business
            </p>
          </div>
        </div>
        <SmartButton
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<FiZap className="w-4 h-4" />}
        >
          Ask Assistant
        </SmartButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <InsightCard insight={insight} onActionClick={onActionClick} />
          </motion.div>
        ))}
      </div>

      <AskAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAskAssistant}
      />
    </div>
  );
}

