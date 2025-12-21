import * as React from "react";
import {
  FiUser,
  FiUsers,
  FiMail,
  FiPhone,
  FiStar,
  FiTarget,
  FiClock,
  FiX,
  FiEdit,
  FiMessageSquare,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";

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

interface ViewTrainerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer;
  onSuccess?: () => void;
  isPro?: boolean;
}

export default function ViewTrainerProfileModal({
  isOpen,
  onClose,
  trainer,
  onSuccess,
  isPro = false,
}: ViewTrainerProfileModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "available":
        return "bg-sky-100 text-sky-800";
      case "busy":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
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

  const handleEdit = () => {
    onClose();
    toast.success("Edit functionality would open here");
  };

  const handleMessage = () => {
    onClose();
    toast.success("Message functionality would open here");
  };

  if (!isOpen) return null;

  return (
    <ColorfulModalUI
      open={isOpen}
      onClose={onClose}
      title="Trainer Profile"
      subtitle={`View ${trainer.name}'s complete profile information`}
    >
      <div className="space-y-8">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-5 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center shadow-lg ring-4 ring-sky-100">
            <span className="text-white font-semibold text-xl">
              {trainer.avatar}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{trainer.name}</h2>
            <p className="text-gray-600 font-medium mb-3">{trainer.specialty}</p>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${getStatusColor(trainer.status)}`}
              >
                {trainer.status.charAt(0).toUpperCase() +
                  trainer.status.slice(1)}
              </span>
              <div className="flex items-center gap-1.5">
                {renderStars(trainer.rating)}
                <span className="text-sm font-semibold text-gray-700 ml-1">
                  {trainer.rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-blue-500" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg">
                <FiMail className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-900">{trainer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg">
                <FiPhone className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Phone</p>
                <p className="text-sm font-medium text-gray-900">{trainer.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTarget className="w-5 h-5 text-green-500" />
            Professional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg">
                <FiTarget className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Specialty</p>
                <p className="text-sm font-medium text-gray-900">{trainer.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg">
                <FiClock className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Experience</p>
                <p className="text-sm font-medium text-gray-900">{trainer.experience}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg">
                <FiStar className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Rating</p>
                <div className="flex items-center gap-1.5">
                  {renderStars(trainer.rating)}
                  <span className="text-sm font-semibold text-gray-700">
                    {trainer.rating}/5
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg">
                <FiUsers className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Classes Assigned</p>
                <p className="text-sm font-medium text-gray-900">
                  {trainer.classes} classes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTarget className="w-5 h-5 text-purple-500" />
            Performance Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-5 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {trainer.classes}
              </div>
              <div className="text-sm font-medium text-blue-700">Classes This Month</div>
            </div>
            <div className="text-center p-5 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {trainer.rating}
              </div>
              <div className="text-sm font-medium text-green-700">Average Rating</div>
            </div>
            <div className="text-center p-5 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors">
              <div className="text-3xl font-bold text-purple-600 mb-1">95%</div>
              <div className="text-sm font-medium text-purple-700">Attendance Rate</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <SmartButton variant="secondary" size="sm" onClick={onClose}>
            <FiX className="h-4 w-4 mr-2" />
            Close
          </SmartButton>
          <SmartButton variant="primary" size="sm" onClick={handleEdit}>
            <FiEdit className="h-4 w-4 mr-2" />
            Edit Profile
          </SmartButton>
        </div>
      </div>
    </ColorfulModalUI>
  );
}



