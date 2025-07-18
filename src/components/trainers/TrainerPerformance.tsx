import React, { useState, useEffect } from 'react';
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
  ChartData
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { FiTrendingUp, FiUsers, FiStar, FiClock } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
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
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
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
        .from('trainers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTrainers(data || []);
      if (data?.[0]) {
        setSelectedTrainer(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
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
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch sessions data
      const { data: sessions, error: sessionsError } = await supabase
        .from('trainer_schedule')
        .select('*')
        .eq('trainer_id', selectedTrainer)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (sessionsError) throw sessionsError;

      // Fetch feedback data
      const { data: feedback, error: feedbackError } = await supabase
        .from('trainer_feedback')
        .select('rating, created_at')
        .eq('trainer_id', selectedTrainer)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (feedbackError) throw feedbackError;

      // Process data by month
      const monthlyData: { [key: string]: TrainerPerformance } = {};
      
      sessions?.forEach(session => {
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
            attendance_rate: 0
          };
        }

        monthlyData[month].total_sessions++;
        
        switch (session.status) {
          case 'completed':
            monthlyData[month].completed_sessions++;
            break;
          case 'cancelled':
            monthlyData[month].cancelled_sessions++;
            break;
          case 'no_show':
            monthlyData[month].no_shows++;
            break;
        }
      });

      // Calculate average ratings by month
      feedback?.forEach(item => {
        const month = new Date(item.created_at).toISOString().slice(0, 7);
        if (monthlyData[month]) {
          monthlyData[month].avg_rating = (monthlyData[month].avg_rating + item.rating) / 2;
        }
      });

      // Calculate attendance rates and format final data
      const performanceData = Object.values(monthlyData).map(month => ({
        ...month,
        attendance_rate: (month.completed_sessions / month.total_sessions) * 100
      }));

      setPerformance(performanceData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('trainer_feedback')
        .select(`
          comment,
          rating,
          created_at,
          member:profiles (name)
        `)
        .eq('trainer_id', selectedTrainer)
        .order('rating', { ascending: false })
        .limit(5);

      if (error) throw error;

      setTopFeedback(
        data.map((item: any) => ({
          comment: item.comment,
          rating: item.rating,
          member_name: item.member.name,
          created_at: item.created_at
        }))
      );
    } catch (err: any) {
      console.error('Error fetching top feedback:', err);
    }
  };

  const getLatestPerformance = (): TrainerPerformance | null => {
    if (performance.length === 0) return null;
    return performance[performance.length - 1];
  };

  const getAveragePerformance = (): TrainerPerformance | null => {
    if (performance.length === 0) return null;
    
    const totals = performance.reduce((acc, curr) => ({
      total_sessions: acc.total_sessions + curr.total_sessions,
      completed_sessions: acc.completed_sessions + curr.completed_sessions,
      cancelled_sessions: acc.cancelled_sessions + curr.cancelled_sessions,
      no_shows: acc.no_shows + curr.no_shows,
      total_members: acc.total_members + curr.total_members,
      avg_rating: acc.avg_rating + curr.avg_rating,
      revenue: acc.revenue + curr.revenue,
      attendance_rate: acc.attendance_rate + curr.attendance_rate,
      trainer_id: curr.trainer_id,
      month: ''
    }));

    return {
      ...totals,
      avg_rating: totals.avg_rating / performance.length,
      attendance_rate: totals.attendance_rate / performance.length
    };
  };

  const sessionsData: ChartData<'line'> = {
    labels: performance.map(p => new Date(p.month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })),
    datasets: [
      {
        label: 'Total Sessions',
        data: performance.map(p => p.total_sessions),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1
      },
      {
        label: 'Completed Sessions',
        data: performance.map(p => p.completed_sessions),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.1
      }
    ]
  };

  const attendanceData: ChartData<'bar'> = {
    labels: performance.map(p => new Date(p.month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: performance.map(p => p.attendance_rate),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const latestStats = getLatestPerformance();
  const averageStats = getAveragePerformance();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2">
          <select
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiTrendingUp className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {latestStats?.total_sessions || 0}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Avg: {averageStats?.total_sessions.toFixed(1) || 0} per month
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-semibold text-gray-900">
                {latestStats?.total_members || 0}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Avg: {averageStats?.total_members.toFixed(1) || 0} per month
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiStar className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {latestStats?.avg_rating.toFixed(1) || 0}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Overall: {averageStats?.avg_rating.toFixed(1) || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {latestStats?.attendance_rate.toFixed(1) || 0}%
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Avg: {averageStats?.attendance_rate.toFixed(1) || 0}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sessions Over Time</h3>
          <Line
            data={sessionsData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Rate</h3>
          <Bar
            data={attendanceData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value) => `${value}%`
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Top Feedback */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Feedback</h3>
        <div className="space-y-4">
          {topFeedback.map((feedback, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`h-4 w-4 ${
                          i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">
                    by {feedback.member_name}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(feedback.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-gray-700">{feedback.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 