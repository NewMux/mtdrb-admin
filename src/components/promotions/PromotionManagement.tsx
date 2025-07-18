import React, { useState } from "react";
import { FiEdit3, FiTrash2, FiPlay, FiPause, FiEye, FiBarChart } from "react-icons/fi"; 

interface PromotionManagementProps {
  refreshKey: number;
  stats: any;
}

const PromotionManagement: React.FC<PromotionManagementProps> = ({ refreshKey, stats }) => {
  const [promotions] = useState([
    {
      id: "1",
      name: "New Year Fitness Challenge",
      type: "Seasonal",
      status: "active",
      discount: "30% off",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      conversions: 89,
      revenue: "$4,450",
      channels: ["Email", "Social"]
    },
    {
      id: "2", 
      name: "Friend Referral Bonus",
      type: "Referral",
      status: "active",
      discount: "$50 credit",
      startDate: "2023-12-15",
      endDate: "2024-03-15",
      conversions: 67,
      revenue: "$3,350",
      channels: ["Email", "In-App"]
    },
    {
      id: "3",
      name: "Student Discount Program", 
      type: "Demographic",
      status: "paused",
      discount: "25% off",
      startDate: "2023-09-01",
      endDate: "2024-05-31",
      conversions: 34,
      revenue: "$1,700",
      channels: ["Email", "Social"]
    },
    {
      id: "4",
      name: "Win-Back Special",
      type: "Retention", 
      status: "draft",
      discount: "50% off",
      startDate: "2024-02-01",
      endDate: "2024-02-29",
      conversions: 0,
      revenue: "$0",
      channels: ["Email"]
    }
  ]);

  const statusColors = {
    active: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30",
    paused: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30",
    draft: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700",
    expired: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30"
  };

  const handleEdit = (id: string) => {
    alert(`Edit promotion ${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this promotion?")) {
      alert(`Deleted promotion ${id}`);
    }
  };

  const handleToggleStatus = (id: string) => {
    alert(`Toggle status for promotion ${id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Promotion Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all promotional campaigns and offers</p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors">
          New Promotion
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{promotions.length}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Promotions</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {promotions.filter(p => p.status === "active").length}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Active</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {promotions.reduce((sum, p) => sum + p.conversions, 0)}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Conversions</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${promotions.reduce((sum, p) => sum + parseInt(p.revenue.replace(/[^0-9]/g, "")), 0).toLocaleString()}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Promotion</th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Type</th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Performance</th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Duration</th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{promo.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{promo.discount}</p>
                      <div className="flex space-x-1 mt-1">
                        {promo.channels.map((channel, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                      {promo.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[promo.status as keyof typeof statusColors]}`}>
                      {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{promo.conversions} conversions</p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">{promo.revenue}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>{new Date(promo.startDate).toLocaleDateString()}</p>
                      <p>to {new Date(promo.endDate).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(promo.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                        title={promo.status === "active" ? "Pause" : "Activate"}
                      >
                        {promo.status === "active" ? <FiPause className="h-4 w-4" /> : <FiPlay className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => alert(`View analytics for ${promo.name}`)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors"
                        title="Analytics"
                      >
                        <FiBarChart className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(promo.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                        title="Edit"
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionManagement;
export { PromotionManagement };
