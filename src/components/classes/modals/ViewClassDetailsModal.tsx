import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiDollarSign,
} from "react-icons/fi";
import SmartModal from "./SmartModal";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";

interface ClassMember {
  id: string;
  name: string;
  email: string;
  status: "enrolled" | "waitlist" | "attended" | "no-show";
  joined_date: string;
  attendance_history: number;
  is_vip: boolean;
}

interface ClassAnalytics {
  total_enrolled: number;
  total_waitlist: number;
  attendance_rate: number;
  revenue: number;
  capacity_utilization: number;
  popular_time_slot: boolean;
  trainer_rating: number;
}

interface ViewClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const ViewClassDetailsModal: React.FC<ViewClassDetailsModalProps> = ({
  isOpen,
  onClose,
  classId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuccess,
  isPro = false,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, setLoading] = useState(false);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "analytics"
  >("overview");

  const { classData, fetchClass } = useSmartClassModal({ classId, isPro });

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
      loadClassDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classId]);

  // Load mock class details
  const loadClassDetails = () => {
    const mockMembers: ClassMember[] = [
      {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        status: "enrolled",
        joined_date: "2024-01-10T09:00:00Z",
        attendance_history: 95,
        is_vip: true,
      },
      {
        id: "2",
        name: "Mike Chen",
        email: "mike@example.com",
        status: "enrolled",
        joined_date: "2024-01-12T14:30:00Z",
        attendance_history: 87,
        is_vip: false,
      },
      {
        id: "3",
        name: "Emma Davis",
        email: "emma@example.com",
        status: "waitlist",
        joined_date: "2024-01-15T11:15:00Z",
        attendance_history: 92,
        is_vip: true,
      },
      {
        id: "4",
        name: "Alex Rodriguez",
        email: "alex@example.com",
        status: "enrolled",
        joined_date: "2024-01-08T16:45:00Z",
        attendance_history: 78,
        is_vip: false,
      },
      {
        id: "5",
        name: "Lisa Wang",
        email: "lisa@example.com",
        status: "enrolled",
        joined_date: "2024-01-14T10:20:00Z",
        attendance_history: 89,
        is_vip: false,
      },
    ];

    const mockAnalytics: ClassAnalytics = {
      total_enrolled: 4,
      total_waitlist: 1,
      attendance_rate: 92.5,
      revenue: 180,
      capacity_utilization: 80,
      popular_time_slot: true,
      trainer_rating: 4.8,
    };

    setMembers(mockMembers);
    setAnalytics(mockAnalytics);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-green-100 text-green-800";
      case "waitlist":
        return "bg-yellow-100 text-yellow-800";
      case "attended":
        return "bg-blue-100 text-blue-800";
      case "no-show":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enrolled":
        return <FiCheck className="h-3 w-3" />;
      case "waitlist":
        return <FiClock className="h-3 w-3" />;
      case "attended":
        return <FiTrendingUp className="h-3 w-3" />;
      case "no-show":
        return <FiX className="h-3 w-3" />;
      default:
        return <FiAlertCircle className="h-3 w-3" />;
    }
  };

  if (!classData) {
    return (
      <SmartModal
        isOpen={isOpen}
        onClose={onClose}
        title="Class Details"
        subtitle="Loading class data..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SmartModal>
    );
  }

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Class Details"
      subtitle={classData.name}
      maxWidth="5xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100bg-blue-900/30 rounded-lg border border-blue-200border-blue-800">
              <FiUsers className="h-4 w-4 text-blue-700text-blue-300" />
              <span className="text-sm font-medium text-blue-800text-blue-200">
                {analytics?.total_enrolled || 0} enrolled
              </span>
            </div>
            {(analytics?.total_waitlist ?? 0) > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-amber-100bg-amber-900/30 rounded-lg border border-amber-200border-amber-800">
                <FiClock className="h-4 w-4 text-amber-700text-amber-300" />
                <span className="text-sm font-medium text-amber-800text-amber-200">
                  {analytics?.total_waitlist ?? 0} on waitlist
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Class Header */}
        <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/25 rounded-lg backdrop-blur-sm">
                  <FiCalendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white drop-shadow-sm">{classData.name}</h2>
              </div>
              <p className="text-blue-100 mt-1 font-medium">
                {new Date(classData.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-blue-100 flex items-center space-x-2 mt-1">
                <FiClock className="h-4 w-4" />
                <span className="font-medium">{classData.start_time} - {classData.end_time}</span>
                <span className="text-blue-200">•</span>
                <span className="font-medium">{classData.trainer_name || "No trainer assigned"}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white drop-shadow-sm">
                {classData.enrolled_count}/{classData.capacity}
              </div>
              <div className="text-blue-100 text-sm font-medium">Enrolled</div>
              <div className="mt-2">
                <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-300 shadow-sm"
                    style={{ 
                      width: `${Math.min((classData.enrolled_count / classData.capacity) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-light-200border-dark-600">
          <nav className="flex space-x-8">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: <FiCalendar className="h-4 w-4" />,
              },
              {
                id: "members",
                label: "Members",
                icon: <FiUsers className="h-4 w-4" />,
              },
              {
                id: "analytics",
                label: "Analytics",
                icon: <FiTrendingUp className="h-4 w-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "members" | "analytics")}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-blue-50bg-blue-900/10"
                    : "border-transparent text-gray-600text-gray-400 hover:text-gray-900hover:text-gray-200 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100from-green-900/20to-green-800/20 rounded-xl border border-green-200border-green-800/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-500 rounded-xl">
                      <FiTrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600text-green-400 font-medium">
                        Attendance Rate
                      </p>
                      <p className="text-xl font-bold text-green-700text-green-300">
                        {analytics?.attendance_rate || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100from-blue-900/20to-blue-800/20 rounded-xl border border-blue-200border-blue-800/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-500 rounded-xl">
                      <FiUsers className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600text-blue-400 font-medium">
                        Capacity Utilization
                      </p>
                      <p className="text-xl font-bold text-blue-700text-blue-300">
                        {analytics?.capacity_utilization || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100from-yellow-900/20to-yellow-800/20 rounded-xl border border-yellow-200border-yellow-800/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-yellow-500 rounded-xl">
                      <FiStar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-yellow-600text-yellow-400 font-medium">
                        Trainer Rating
                      </p>
                      <p className="text-xl font-bold text-yellow-700text-yellow-300">
                        {analytics?.trainer_rating || 0}/5
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-whitebg-dark-800 rounded-xl border border-light-200border-dark-600 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-brand-100bg-brand-900/20 rounded-lg">
                      <FiCalendar className="h-4 w-4 text-brand-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-dark-900text-white">
                      Class Information
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Class Type:
                      </span>
                      <span className="text-dark-900text-white font-medium">
                        {classData.type || "General"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Duration:
                      </span>
                      <span className="text-dark-900text-white font-medium">
                        60 minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Location:
                      </span>
                      <span className="text-dark-900text-white font-medium">
                        {classData.location || "Studio A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Difficulty:
                      </span>
                      <span className="text-dark-900text-white font-medium">
                        Intermediate
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-whitebg-dark-800 rounded-xl border border-light-200border-dark-600 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-2 bg-green-100bg-green-900/20 rounded-lg">
                      <FiDollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-dark-900text-white">
                      Financial Summary
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Revenue:
                      </span>
                      <span className="text-green-600text-green-400 font-semibold">
                        ${analytics?.revenue || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Cost per Member:
                      </span>
                      <span className="text-dark-900text-white font-medium">
                        $45
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Profit Margin:
                      </span>
                      <span className="text-green-600text-green-400 font-semibold">
                        65%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-light-100border-dark-700 last:border-b-0">
                      <span className="text-light-600text-dark-400">
                        Popular Time:
                      </span>
                      <span className={`font-medium ${analytics?.popular_time_slot ? 'text-green-600text-green-400' : 'text-orange-600text-orange-400'}`}>
                        {analytics?.popular_time_slot ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "members" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dark-900text-white">
                  Class Members ({members.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-light-600text-dark-400">
                    Filter:
                  </span>
                  <select className="text-xs border border-light-200border-dark-600 rounded-lg px-2 py-1 bg-light-50bg-dark-700">
                    <option value="all">All Members</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="vip">VIP Members</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-light-200border-dark-600 rounded-xl bg-light-50bg-dark-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(member.status)}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(member.status)}`}
                          >
                            {member.status}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-dark-900text-white">
                              {member.name}
                            </h4>
                            {member.is_vip && (
                              <FiStar className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-light-600text-dark-400">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs">
                        <div className="text-center">
                          <div className="text-light-600text-dark-400">
                            Joined
                          </div>
                          <div className="font-medium text-dark-900text-white">
                            {new Date(member.joined_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-light-600text-dark-400">
                            Attendance
                          </div>
                          <div className="font-medium text-dark-900text-white">
                            {member.attendance_history}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Analytics Charts Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-light-50bg-dark-700 rounded-xl border border-light-200border-dark-600">
                  <h3 className="text-sm font-semibold text-dark-900text-white mb-3">
                    Enrollment Trend
                  </h3>
                  <div className="h-32 bg-gray-100bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-500">
                      Chart Placeholder
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-light-50bg-dark-700 rounded-xl border border-light-200border-dark-600">
                  <h3 className="text-sm font-semibold text-dark-900text-white mb-3">
                    Attendance Pattern
                  </h3>
                  <div className="h-32 bg-gray-100bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-500">
                      Chart Placeholder
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-4 bg-light-50bg-dark-700 rounded-xl border border-light-200border-dark-600">
                <h3 className="text-sm font-semibold text-dark-900text-white mb-3">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.attendance_rate || 0}%
                    </div>
                    <div className="text-light-600text-dark-400">
                      Attendance Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.capacity_utilization || 0}%
                    </div>
                    <div className="text-light-600text-dark-400">
                      Capacity Used
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analytics?.trainer_rating || 0}/5
                    </div>
                    <div className="text-light-600text-dark-400">
                      Trainer Rating
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${analytics?.revenue || 0}
                    </div>
                    <div className="text-light-600text-dark-400">
                      Revenue
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </SmartModal>
  );
};

export default ViewClassDetailsModal;
