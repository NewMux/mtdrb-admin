import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { FiTrendingUp, FiUsers, FiStar, FiClock } from "react-icons/fi";
import { supabase } from "../../supabaseClient";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface TrainerPerformance {
  trainer_id: string;
  month: string;
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_shows: number;
  total_members: number;
  avg_rating: number;
  revenue: number;
  attendance_rate: number;
}

interface TopFeedback {
  comment: string;
  rating: number;
  member_name: string;
  created_at: string;
}

export default function TrainerPerformance() {
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [dateRange, setDateRange] = useState<"1m" | "3m" | "6m" | "1y">("3m");
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [performance, setPerformance] = useState<TrainerPerformance[]>([]);
  const [topFeedback, setTopFeedback] = useState<TopFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (selectedTrainer) {
      fetchPerformanceData();
      fetchTopFeedback();
    }
  }, [selectedTrainer, dateRange]);

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from("trainers")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTrainers(data || []);
      if (data?.[0]) {
        setSelectedTrainer(data[0].id);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case "1m":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3m":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6m":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "1y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch sessions data
      const { data: sessions, error: sessionsError } = await supabase
        .from("trainer_schedule")
        .select("*")
        .eq("trainer_id", selectedTrainer)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString());

      if (sessionsError) throw sessionsError;

      // Fetch feedback data
      const { data: feedback, error: feedbackError } = await supabase
        .from("trainer_feedback")
        .select("rating, created_at")
        .eq("trainer_id", selectedTrainer)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (feedbackError) throw feedbackError;

      // Process data by month
      const monthlyData: { [key: string]: TrainerPerformance } = {};

      sessions?.forEach((session) => {
        const month = new Date(session.start_time).toISOString().slice(0, 7);

        if (!monthlyData[month]) {
          monthlyData[month] = {
            trainer_id: selectedTrainer,
            month,
            total_sessions: 0,
            completed_sessions: 0,
            cancelled_sessions: 0,
            no_shows: 0,
            total_members: 0,
            avg_rating: 0,
            revenue: 0,
            attendance_rate: 0,
          };
        }

        monthlyData[month].total_sessions++;

        switch (session.status) {
          case "completed":
            monthlyData[month].completed_sessions++;
            break;
          case "cancelled":
            monthlyData[month].cancelled_sessions++;
            break;
          case "no_show":
            monthlyData[month].no_shows++;
            break;
        }
      });

      // Calculate average ratings by month
      feedback?.forEach((item) => {
        const month = new Date(item.created_at).toISOString().slice(0, 7);
        if (monthlyData[month]) {
          monthlyData[month].avg_rating =
            (monthlyData[month].avg_rating + item.rating) / 2;
        }
      });

      // Calculate attendance rates and format final data
      const performanceData = Object.values(monthlyData).map((month) => ({
        ...month,
        attendance_rate:
          (month.completed_sessions / month.total_sessions) * 100,
      }));

      setPerformance(performanceData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("trainer_feedback")
        .select("comment, rating, member_name, created_at")
        .eq("trainer_id", selectedTrainer)
        .order("rating", { ascending: false })
        .limit(5);

      if (error) throw error;
      setTopFeedback(data || []);
    } catch (err: unknown) {
      console.error("Error fetching top feedback:", err);
    }
  };

  const getLatestPerformance = (): TrainerPerformance | null => {
    return performance.length > 0 ? performance[performance.length - 1] : null;
  };

  const getAveragePerformance = (): TrainerPerformance | null => {
    if (performance.length === 0) return null;

    const totals = performance.reduce(
      (acc, curr) => ({
        total_sessions: acc.total_sessions + curr.total_sessions,
        completed_sessions: acc.completed_sessions + curr.completed_sessions,
        cancelled_sessions: acc.cancelled_sessions + curr.cancelled_sessions,
        no_shows: acc.no_shows + curr.no_shows,
        avg_rating: acc.avg_rating + curr.avg_rating,
        revenue: acc.revenue + curr.revenue,
      }),
      {
        total_sessions: 0,
        completed_sessions: 0,
        cancelled_sessions: 0,
        no_shows: 0,
        avg_rating: 0,
        revenue: 0,
      }
    );

    const count = performance.length;
    return {
      trainer_id: selectedTrainer,
      month: "Average",
      total_sessions: totals.total_sessions,
      completed_sessions: totals.completed_sessions,
      cancelled_sessions: totals.cancelled_sessions,
      no_shows: totals.no_shows,
      total_members: 0,
      avg_rating: totals.avg_rating / count,
      revenue: totals.revenue,
      attendance_rate: (totals.completed_sessions / totals.total_sessions) * 100,
    };
  };

  const chartData: ChartData<"line"> = {
    labels: performance.map((p) => p.month),
    datasets: [
      {
        label: "Completed Sessions",
        data: performance.map((p) => p.completed_sessions),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Cancelled Sessions",
        data: performance.map((p) => p.cancelled_sessions),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const ratingData: ChartData<"bar"> = {
    labels: performance.map((p) => p.month),
    datasets: [
      {
        label: "Average Rating",
        data: performance.map((p) => p.avg_rating),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
      },
    ],
  };

  const latest = getLatestPerformance();
  const average = getAveragePerformance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trainer Performance</h2>
          <p className="text-gray-600">Track and analyze trainer metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as "1m" | "3m" | "6m" | "1y")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiTrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latest?.total_sessions || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FiUsers className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latest?.attendance_rate.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FiStar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latest?.avg_rating.toFixed(1) || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiClock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">No Shows</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latest?.no_shows || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Session Trends
              </h3>
              <Line data={chartData} />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rating Trends
              </h3>
              <Bar data={ratingData} />
            </div>
          </div>

          {/* Top Feedback */}
          {topFeedback.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Feedback
              </h3>
              <div className="space-y-4">
                {topFeedback.map((feedback, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < feedback.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">
                        {feedback.member_name}
                      </p>
                      <p className="text-gray-600 text-sm">{feedback.comment}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
