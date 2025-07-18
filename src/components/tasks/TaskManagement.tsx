import React, { useState } from "react";
import { FiCheckSquare, FiPlus } from "react-icons/fi";

interface TaskManagementProps {
  refreshKey: number;
  stats: any;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ refreshKey, stats }) => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all gym tasks</p>
        </div>
        <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold flex items-center space-x-2 min-h-[44px]">
          <FiPlus className="h-4 w-4" />
          <span>Create Task</span>
        </button>
      </div>
      <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
        <FiCheckSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Management</h3>
        <p className="text-gray-600">Comprehensive task management system coming soon</p>
      </div>
    </div>
  );
};
