import React, { useState, useEffect } from "react";
import {
  FiGift,
  FiUsers,
  FiTrendingUp,
  FiMail,
  FiPhone,
  FiTarget,
  FiClock,
  FiAward,
  FiZap,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface LiveActivity {
  id: string;
  type:
    | "redemption"
    | "opened"
    | "converted"
    | "referred"
    | "birthday"
    | "milestone";
  message: string;
  member: string;
  campaign: string;
  value?: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

const LiveFeedWidget: React.FC = () => {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Simulate real-time activity feed
    const generateActivity = (): LiveActivity => {
      const types = [
        {
          type: "redemption" as const,
          message: "redeemed referral bonus",
          icon: <FiGift className="h-4 w-4" />,
          color: "green",
        },
        {
          type: "opened" as const,
          message: "opened email campaign",
          icon: <FiMail className="h-4 w-4" />,
          color: "blue",
        },
        {
          type: "converted" as const,
          message: "converted from email campaign",
          icon: <FiPhone className="h-4 w-4" />,
          color: "purple",
        },
        {
          type: "referred" as const,
          message: "referred a new member",
          icon: <FiUsers className="h-4 w-4" />,
          color: "orange",
        },
        {
          type: "birthday" as const,
          message: "received birthday promotion",
          icon: <FiAward className="h-4 w-4" />,
          color: "pink",
        },
        {
          type: "milestone" as const,
          message: "reached 10th class milestone",
          icon: <FiTarget className="h-4 w-4" />,
          color: "indigo",
        },
      ];

      const campaigns = [
        "New Year Fitness Challenge",
        "Referral Rewards Program",
        "Birthday Special",
        "Welcome Back Campaign",
        "Peak Class Promotion",
        "Member Milestone",
      ];

      const members = [
        "Sarah Johnson",
        "Mike Chen",
        "Emma Davis",
        "Alex Rodriguez",
        "Lisa Thompson",
        "David Kim",
        "Rachel Green",
        "Tom Wilson",
      ];

      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomCampaign =
        campaigns[Math.floor(Math.random() * campaigns.length)];
      const randomMember = members[Math.floor(Math.random() * members.length)];

      return {
        id: Math.random().toString(36).substr(2, 9),
        type: randomType.type,
        message: randomType.message,
        member: randomMember,
        campaign: randomCampaign,
        value: randomType.type === "redemption" ? "$25 credit" : undefined,
        timestamp: new Date(),
        icon: randomType.icon,
        color: randomType.color,
      };
    };

    // Initial activities
    const initialActivities = Array.from({ length: 5 }, () =>
      generateActivity(),
    );
    setActivities(initialActivities);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities((prev) => [newActivity, ...prev.slice(0, 9)]); // Keep max 10 activities
    }, 3000); // Add new activity every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - timestamp.getTime()) / 1000,
    );

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      case "purple":
        return "bg-purple-100 text-purple-800";
      case "orange":
        return "bg-orange-100 text-orange-800";
      case "pink":
        return "bg-pink-100 text-pink-800";
      case "indigo":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <FiZap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Live Activity Feed
            </h2>
            <p className="text-sm text-gray-600">
              Real-time campaign engagement
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {(isExpanded ? activities : activities.slice(0, 3)).map(
            (activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg ${getColorClasses(activity.color)}`}
                >
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    <span className="font-semibold">{activity.member}</span>{" "}
                    {activity.message}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span className="truncate">{activity.campaign}</span>
                    {activity.value && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-green-600">
                          {activity.value}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <FiClock className="h-3 w-3" />
                  <span>{getTimeAgo(activity.timestamp)}</span>
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>

      {!isExpanded && activities.length > 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View {activities.length - 3} more activities →
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>🔥 {activities.length} activities today</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <FiTrendingUp className="h-4 w-4 text-green-600" />
              <span>+23% engagement</span>
            </span>
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              View Analytics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeedWidget;
export { LiveFeedWidget };
