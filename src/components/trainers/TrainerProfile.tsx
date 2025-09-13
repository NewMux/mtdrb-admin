import React, { useState, useEffect } from "react";
import {
  FiEdit2,
  FiStar,
  FiCalendar,
  FiDollarSign,
  FiMessageSquare,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import AddTrainerModal from "./AddTrainerModal";
import dayjs from "dayjs";

interface Props {
  trainerId: string;
  onClose: () => void;
}

interface TrainerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  specialties: string[];
  languages: string[];
  bio: string;
  status: string;
  profile_image_url: string;
  social_links: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  hourly_rate: number;
  commission_percentage: number;
  salary_type: string;
  fixed_salary: number;
  rating: number;
  total_sessions: number;
  active_members: number;
}

interface Document {
  id: string;
  document_type: string;
  file_url: string;
  expiry_date: string | null;
  status: string;
  verified: boolean;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  member: {
    name: string;
    profile_image_url: string;
  };
}

interface Performance {
  month: string;
  total_sessions: number;
  attendance_rate: number;
  avg_rating: number;
  revenue: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  profile_image_url?: string;
}

interface Class {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  session_type: string;
  payment_amount: number;
}

interface SessionData {
  total_sessions: number;
  completed_sessions: number;
  revenue: number;
}

interface Earnings {
  thisMonth: number;
  lastMonth: number;
}

export default function TrainerProfile({ trainerId }: Props) {
  const [trainer, setTrainer] = useState<TrainerData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);
  const [recentClasses, setRecentClasses] = useState<Class[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({
    thisMonth: 0,
    lastMonth: 0,
  });

  useEffect(() => {
    if (trainerId) {
      fetchTrainerData();
      fetchAssignedMembers();
      fetchRecentClasses();
      fetchEarnings();
    }
  }, [
    trainerId,
    fetchTrainerData,
    fetchAssignedMembers,
    fetchRecentClasses,
    fetchEarnings,
  ]);

  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trainer details
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainers")
        .select("*")
        .eq("id", trainerId)
        .single();

      if (trainerError) throw trainerError;

      // Fetch documents
      const { data: documentData, error: documentError } = await supabase
        .from("trainer_documents")
        .select("*")
        .eq("trainer_id", trainerId);

      if (documentError) throw documentError;

      // Fetch feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("trainer_feedback")
        .select(
          `
          *,
          member:profiles (
            name,
            profile_image_url
          )
        `,
        )
        .eq("trainer_id", trainerId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (feedbackError) throw feedbackError;

      // Fetch performance data
      const { data: performanceData, error: performanceError } = await supabase
        .from("trainer_schedule")
        .select("*")
        .eq("trainer_id", trainerId)
        .gte(
          "start_time",
          new Date(
            new Date().setMonth(new Date().getMonth() - 6),
          ).toISOString(),
        )
        .order("start_time", { ascending: false });

      if (performanceError) throw performanceError;

      // Process performance data by month
      const monthlyPerformance = processPerformanceData(performanceData);

      setTrainer(trainerData);
      setDocuments(documentData);
      setFeedback(feedbackData);
      setPerformance(monthlyPerformance);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const processPerformanceData = (data: Session[]): Performance[] => {
    const monthlyData: { [key: string]: SessionData } = {};

    data.forEach((session) => {
      const month = new Date(session.start_time).toISOString().slice(0, 7);

      if (!monthlyData[month]) {
        monthlyData[month] = {
          total_sessions: 0,
          completed_sessions: 0,
          revenue: 0,
        };
      }

      monthlyData[month].total_sessions++;
      if (session.status === "completed") {
        monthlyData[month].completed_sessions++;
        // Calculate revenue based on session type and trainer payment structure
        monthlyData[month].revenue += calculateSessionRevenue(session);
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      total_sessions: data.total_sessions,
      attendance_rate: (data.completed_sessions / data.total_sessions) * 100,
      avg_rating: 0, // This would need to be calculated from feedback data
      revenue: data.revenue,
    }));
  };

  const calculateSessionRevenue = (session: Session): number => {
    if (!trainer) return 0;

    let revenue = 0;
    const duration =
      (new Date(session.end_time).getTime() -
        new Date(session.start_time).getTime()) /
      (1000 * 60 * 60); // hours

    if (trainer.salary_type === "hourly" || trainer.salary_type === "hybrid") {
      revenue += trainer.hourly_rate * duration;
    }

    if (
      trainer.salary_type === "commission" ||
      trainer.salary_type === "hybrid"
    ) {
      // Assuming a base session rate of $50/hour for commission calculation
      const sessionRate = 50 * duration;
      revenue += sessionRate * (trainer.commission_percentage / 100);
    }

    return revenue;
  };

  const fetchAssignedMembers = async () => {
    try {
      const { data: members, error } = await supabase
        .from("members")
        .select(
          `
          id,
          name,
          email,
          phone,
          status,
          membership_type,
          payment_status,
          joined_at,
          last_check_in
        `,
        )
        .eq("assigned_trainer_id", trainerId)
        .order("name");

      if (!error && members) {
        setAssignedMembers(members);
      }
    } catch (error) {
      console.error("Error fetching assigned members:", error);
    }
  };

  const fetchRecentClasses = async () => {
    try {
      const { data: classes, error } = await supabase
        .from("classes")
        .select(
          `
          id,
          name,
          start_time,
          end_time,
          location,
          capacity,
          bookings:class_bookings(count)
        `,
        )
        .eq("trainer_id", trainerId)
        .gte(
          "start_time",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ) // Last 7 days
        .order("start_time", { ascending: false })
        .limit(5);

      if (!error && classes) {
        setRecentClasses(classes);
      }
    } catch (error) {
      console.error("Error fetching recent classes:", error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const currentMonth = new Date();
      const lastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      );
      const thisMonthStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );

      // Fetch trainer payments for this month and last month
      const { data: payments, error } = await supabase
        .from("trainer_payments")
        .select("amount, payment_date")
        .eq("trainer_id", trainerId)
        .gte("payment_date", lastMonth.toISOString());

      if (!error && payments) {
        const thisMonthEarnings = payments
          .filter((p) => new Date(p.payment_date) >= thisMonthStart)
          .reduce((sum, p) => sum + p.amount, 0);

        const lastMonthEarnings = payments
          .filter(
            (p) =>
              new Date(p.payment_date) >= lastMonth &&
              new Date(p.payment_date) < thisMonthStart,
          )
          .reduce((sum, p) => sum + p.amount, 0);

        setEarnings({
          thisMonth: thisMonthEarnings,
          lastMonth: lastMonthEarnings,
        });
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 p-6">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiMessageSquare className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading trainer profile
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error || "Trainer not found"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={
                trainer.profile_image_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=random`
              }
              alt={trainer.name}
              className="h-16 w-16 rounded-full"
            />
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {trainer.name}
              </h2>
              <div className="flex items-center mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${
                    trainer.status === "active"
                      ? "bg-green-100 text-green-800"
                      : trainer.status === "on_leave"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {trainer.status}
                </span>
                <div className="flex items-center ml-4">
                  <FiStar className="h-4 w-4 text-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600">
                    {trainer.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 ease-in-out min-h-[44px]"
          >
            <FiEdit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiCalendar className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">
                Total Sessions
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {trainer.total_sessions}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiStar className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">
                Active Members
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {trainer.active_members}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiDollarSign className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">
                Payment Type
              </span>
            </div>
            <p className="mt-2 text-lg font-semibold text-gray-900 capitalize">
              {trainer.salary_type}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiFileText className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">
                Documents
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {documents.length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {["info", "documents", "feedback", "performance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "info" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Contact Information
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="mt-1">{trainer.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="mt-1">{trainer.phone}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Expertise</h3>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-500">
                  Specialties
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {trainer.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-500">
                  Languages
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {trainer.languages.map((language) => (
                    <span
                      key={language}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Bio</h3>
              <p className="mt-3 text-gray-600">{trainer.bio}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Social Links
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(trainer.social_links).map(
                  ([platform, url]) =>
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <span className="capitalize">{platform}</span>
                        <svg
                          className="ml-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ),
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <FiFileText className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {doc.document_type}
                    </p>
                    {doc.expiry_date && (
                      <p className="text-sm text-gray-500">
                        Expires:{" "}
                        {new Date(doc.expiry_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        doc.verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                  >
                    {doc.verified ? "Verified" : "Pending"}
                  </span>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="space-y-6">
            {feedback.map((item) => (
              <div key={item.id} className="border-b border-gray-200 pb-6">
                <div className="flex items-center">
                  <img
                    src={
                      item.member.profile_image_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.member.name)}&background=random`
                    }
                    alt={item.member.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {item.member.name}
                    </p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-gray-600">{item.comment}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performance.map((month) => (
                <div key={month.month} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900">
                    {new Date(month.month).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Sessions</span>
                      <span className="font-medium">
                        {month.total_sessions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attendance Rate</span>
                      <span className="font-medium">
                        {month.attendance_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Revenue</span>
                      <span className="font-medium">
                        ${month.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Total Sessions
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {trainer.total_sessions}
            </p>
            <p className="mt-1 text-sm text-green-600">
              +{recentClasses.length} this week
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Assigned Members
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {assignedMembers.length}
            </p>
            <p className="mt-1 text-sm text-blue-600">
              {assignedMembers.filter((m) => m.status === "Active").length}{" "}
              active
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              This Month Earnings
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              BHD {earnings.thisMonth.toFixed(2)}
            </p>
            <p
              className={`mt-1 text-sm ${earnings.thisMonth >= earnings.lastMonth ? "text-green-600" : "text-red-600"}`}
            >
              {earnings.thisMonth >= earnings.lastMonth ? "+" : ""}
              {(
                ((earnings.thisMonth - earnings.lastMonth) /
                  Math.max(earnings.lastMonth, 1)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Average Rating
            </h3>
            <p className="mt-2 text-lg font-semibold text-gray-900 capitalize">
              {trainer.salary_type}
            </p>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-semibold text-yellow-500">⭐</span>
              <span className="ml-1 text-sm text-gray-600">
                {trainer.rating?.toFixed(1) || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Members Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Assigned Members
            </h3>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
              {assignedMembers.length} members
            </span>
          </div>
          <div className="p-6">
            {assignedMembers.length > 0 ? (
              <div className="space-y-4">
                {assignedMembers.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined{" "}
                          {dayjs(member.joined_at).format("MMM DD, YYYY")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : member.status === "Inactive"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {member.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {member.membership_type}
                      </p>
                      <span
                        className={`text-xs ${
                          member.payment_status === "Paid"
                            ? "text-green-600"
                            : member.payment_status === "Overdue"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {member.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
                {assignedMembers.length > 5 && (
                  <button className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2">
                    View All {assignedMembers.length} Members
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No assigned members
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This trainer hasn&apos;t been assigned to any members yet.
                </p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Assign Members
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Classes Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Classes
            </h3>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="p-6">
            {recentClasses.length > 0 ? (
              <div className="space-y-4">
                {recentClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {classItem.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {dayjs(classItem.start_time).format(
                          "MMM DD, YYYY • HH:mm",
                        )}{" "}
                        - {dayjs(classItem.end_time).format("HH:mm")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {classItem.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {classItem.bookings?.[0]?.count || 0} /{" "}
                        {classItem.capacity}
                      </div>
                      <div className="text-xs text-gray-500">attendees</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No recent classes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No classes conducted in the last 7 days.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AddTrainerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          fetchTrainerData();
        }}
      />
    </div>
  );
}
