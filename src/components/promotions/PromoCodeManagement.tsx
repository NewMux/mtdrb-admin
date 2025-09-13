import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCopy,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiDownload,
  FiRefreshCw,
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

interface PromoCodeManagementProps {
  onEditPromoCode: (promoCode: PromoCode) => void;
}

const PromoCodeManagement: React.FC<PromoCodeManagementProps> = ({
  onEditPromoCode,
}) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
      {
        id: "5",
        code: "WELCOME10",
        type: "percentage",
        value: 10,
        maxUses: 150,
        usedCount: 12,
        status: "scheduled",
        expiryDate: "2024-04-30",
        createdAt: "2024-02-01",
        revenue: 600,
        conversionRate: 8.5,
        description: "Welcome discount for new members",
      },
      {
        id: "6",
        code: "SUMMER20",
        type: "percentage",
        value: 20,
        maxUses: 80,
        usedCount: 0,
        status: "inactive",
        expiryDate: "2024-08-31",
        createdAt: "2024-02-15",
        revenue: 0,
        conversionRate: 0,
        description: "Summer fitness promotion",
      },
    ];

    setPromoCodes(mockPromoCodes);
    setLoading(false);
  }, []);

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

  const getUsagePercentage = (used: number, max: number) => {
    return Math.round((used / max) * 100);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Promo code copied to clipboard!");
  };

  const handleBulkAction = (action: string) => {
    if (selectedCodes.length === 0) {
      toast.error("Please select codes to perform bulk action");
      return;
    }

    switch (action) {
      case "activate":
        toast.success(`${selectedCodes.length} codes activated`);
        break;
      case "deactivate":
        toast.success(`${selectedCodes.length} codes deactivated`);
        break;
      case "delete":
        toast.success(`${selectedCodes.length} codes deleted`);
        break;
    }
    setSelectedCodes([]);
  };

  const handleSelectAll = () => {
    if (selectedCodes.length === filteredCodes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(filteredCodes.map((code) => code.id));
    }
  };

  const handleSelectCode = (codeId: string) => {
    setSelectedCodes((prev) =>
      prev.includes(codeId)
        ? prev.filter((id) => id !== codeId)
        : [...prev, codeId],
    );
  };

  const filteredCodes = promoCodes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || code.status === statusFilter;
    const matchesType = typeFilter === "all" || code.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedCodes = [...filteredCodes].sort((a, b) => {
    let aValue = a[sortBy as keyof PromoCode];
    let bValue = b[sortBy as keyof PromoCode];

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Promo Codes
          </h1>
          <p className="text-gray-600 mt-1">
            View, edit, and manage all your discount codes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center space-x-2">
            <FiDownload className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center space-x-2">
            <FiRefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search promo codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="scheduled">Scheduled</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCodes.length > 0 && (
        <div className="bg-purple-50 rounded-3xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-purple-800 font-medium">
              {selectedCodes.length} code{selectedCodes.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction("activate")}
                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-medium transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedCodes.length === filteredCodes.length &&
                      filteredCodes.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCodes.includes(code.id)}
                      onChange={() => handleSelectCode(code.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-mono font-bold text-gray-900">
                        {code.code}
                      </div>
                      <div className="text-sm text-gray-500">
                        {code.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {code.type === "percentage"
                          ? `${code.value}%`
                          : `$${code.value}`}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          code.type === "percentage"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {code.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-900">
                          {code.usedCount}/{code.maxUses}
                        </span>
                        <span className="text-gray-500">
                          {getUsagePercentage(code.usedCount, code.maxUses)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${getUsagePercentage(code.usedCount, code.maxUses)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(code.status)}`}
                    >
                      {code.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-green-600">
                        ${code.revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {code.conversionRate}% conversion
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(code.expiryDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy code"
                      >
                        <FiCopy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditPromoCode(code)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit code"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete code"
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

        {/* Empty State */}
        {sortedCodes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FiGift className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No promo codes found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {sortedCodes.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {sortedCodes.length} of {promoCodes.length} codes
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">1 of 1</span>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManagement;
export { PromoCodeManagement };
