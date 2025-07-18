import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Class {
  id: string;
  name: string;
  bookings?: any[];
  capacity?: number;
  price?: number;
  startTime: string;
  trainer?: {
    name: string;
    performance?: {
      averageRating?: number;
    };
  };
}

interface Booking {
  id: string;
}

interface Analytics {
  attendanceRate: number;
  revenue: number;
}

interface Trainer {
  name: string;
  performance?: {
    averageRating?: number;
    totalClasses?: number;
    totalRevenue?: number;
  };
}

interface Props {
  classes: Class[];
  bookings: Booking[];
  analytics: Analytics;
  trainers: Trainer[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ClassAnalytics({ classes, bookings, analytics, trainers }: Props) {
  const attendanceData = React.useMemo(() => {
    return classes.map(c => ({
      name: c.name,
      attendance: (c.bookings?.length || 0) / (c.capacity || 1) * 100,
      revenue: (c.bookings?.length || 0) * (c.price || 0),
    }));
  }, [classes]);

  const instructorData = React.useMemo(() => {
    return trainers.map(t => ({
      name: t.name,
      rating: t.performance?.averageRating || 0,
      classes: t.performance?.totalClasses || 0,
      revenue: t.performance?.totalRevenue || 0,
    }));
  }, [trainers]);

  const timeSlotData = React.useMemo(() => {
    const slots = classes.reduce((acc, c) => {
      const hour = new Date(c.startTime).getHours();
      const slot = `${hour}:00`;
      acc[slot] = (acc[slot] || 0) + (c.bookings?.length || 0);
      return acc;
    }, {});
    return Object.entries(slots).map(([time, count]) => ({
      time,
      bookings: count,
    }));
  }, [classes]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Average Attendance Rate</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.attendanceRate}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">${analytics.revenue}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Classes</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{classes.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Bookings</h3>
          <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{bookings.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Attendance Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Class Attendance</h3>
          <BarChart width={500} height={300} data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="attendance" fill="#0088FE" name="Attendance %" />
          </BarChart>
        </div>

        {/* Revenue by Time Slot */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bookings by Time Slot</h3>
          <LineChart width={500} height={300} data={timeSlotData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bookings" stroke="#00C49F" />
          </LineChart>
        </div>

        {/* Instructor Performance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Instructor Performance</h3>
          <BarChart width={500} height={300} data={instructorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="rating" fill="#FFBB28" name="Rating" />
            <Bar dataKey="classes" fill="#FF8042" name="Classes Taught" />
          </BarChart>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Distribution</h3>
          <PieChart width={500} height={300}>
            <Pie
              data={instructorData}
              dataKey="revenue"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
            >
              {instructorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{c.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.trainer?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {((c.bookings?.length || 0) / (c.capacity || 1) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${((c.bookings?.length || 0) * (c.price || 0)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {(c.trainer?.performance?.averageRating || 0).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 