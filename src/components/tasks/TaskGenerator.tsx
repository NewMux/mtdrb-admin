import React from "react";
import { FiZap } from "react-icons/fi";

interface TaskGeneratorProps {
  refreshKey: number;
}

export const TaskGenerator: React.FC<TaskGeneratorProps> = ({ refreshKey }) => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Smart Task Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Generate smart task sequences from templates
          </p>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
        <FiZap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Task Generator
        </h3>
        <p className="text-gray-600">
          Smart-powered task generation coming soon
        </p>
      </div>
    </div>
  );
};
