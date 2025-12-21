import React from "react";
import {
  FiUser,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiStar,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  rating: number;
  status: "active" | "inactive" | "busy" | "available";
  classes: number;
  experience: string;
  avatar: string;
}

interface TrainerTableProps {
  trainers?: Trainer[];
  onEdit?: (trainer: Trainer) => void;
  onDelete?: (trainer: Trainer) => void;
  onView?: (trainer: Trainer) => void;
  onAssign?: (trainer: Trainer) => void;
  onMessage?: (trainer: Trainer) => void;
  onSchedule?: (trainer: Trainer) => void;
}

const TrainerTable: React.FC<TrainerTableProps> = ({
  trainers = [],
  onEdit,
  onDelete,
  onView,
  onAssign,
  onMessage,
  onSchedule,
}) => {
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "available":
        return "bg-sky-100 text-sky-800";
      case "busy":
        return "bg-gold-100 text-gold-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case "Yoga & Pilates":
        return "bg-purple-100 text-purple-800";
      case "HIIT & Cardio":
        return "bg-rose-100 text-rose-800";
      case "Strength Training":
        return "bg-gold-100 text-gold-800";
      case "CrossFit":
        return "bg-emerald-100 text-emerald-800";
      case "Zumba & Dance":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : i < rating
              ? "text-yellow-400 fill-current opacity-50"
              : "text-gray-300"
        }`}
      />
    ));
  };

  // Ensure trainers is always an array
  const safeTrainers = Array.isArray(trainers) ? trainers : [];

  if (safeTrainers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <FiUser className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">
            No trainers found
          </h3>
          <p className="text-sm text-gray-500">
            Get started by adding your first trainer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Trainer
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Specialty
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Rating
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
              Status
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {safeTrainers.map((trainer, index) => (
            <tr
              key={trainer.id}
              className={`hover:bg-gray-50 transition-colors duration-200 ${
                index % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50/50/50"
              }`}
              onMouseEnter={() => setHoveredRow(trainer.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {trainer.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {trainer.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {trainer.experience} experience
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-900">
                    {trainer.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trainer.phone}
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecialtyColor(trainer.specialty)}`}
                >
                  {trainer.specialty}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {renderStars(trainer.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {trainer.rating}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainer.status)}`}
                  >
                    {trainer.status.charAt(0).toUpperCase() +
                      trainer.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {trainer.classes} classes
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 text-right">
                <div
                  className={`flex items-center justify-end space-x-2 transition-opacity duration-200 ${
                    hoveredRow === trainer.id ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900"
                    title="View"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onView?.(trainer);
                    }}
                  >
                    <FiEye size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900"
                    title="Edit"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit?.(trainer);
                    }}
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-red-600"
                    title="Delete"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete?.(trainer);
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainerTable;
