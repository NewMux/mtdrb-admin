import * as React from "react";
import { motion } from "framer-motion";
import {
  FiUser,
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
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "available":
        return "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200";
      case "busy":
        return "bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
              : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  const handleEdit = () => {
    onClose();
    // This would typically open the edit modal
    toast.success("Edit functionality would open here");
  };

  const handleMessage = () => {
    onClose();
    // This would typically open the message modal
    toast.success("Message functionality would open here");
  };

  return (
    <ColorfulModalUI
      isOpen={isOpen}
      onClose={onClose}
      title="Trainer Profile"
      subtitle={`View ${trainer.name}'s complete profile information`}
    >
      <div className="space-y-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {trainer.avatar}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{trainer.name}</h2>
            <p className="text-gray-600">{trainer.specialty}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainer.status)}`}
              >
                {trainer.status.charAt(0).toUpperCase() +
                  trainer.status.slice(1)}
              </span>
              <div className="flex items-center gap-1">
                {renderStars(trainer.rating)}
                <span className="text-sm text-gray-600 ml-1">
                  {trainer.rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="text-blue-500" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiMail className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{trainer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiPhone className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{trainer.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTarget className="text-green-500" />
            Professional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiTarget className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Specialty</p>
                <p className="text-sm text-gray-600">{trainer.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiClock className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Experience</p>
                <p className="text-sm text-gray-600">{trainer.experience}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiStar className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Rating</p>
                <div className="flex items-center gap-1">
                  {renderStars(trainer.rating)}
                  <span className="text-sm text-gray-600 ml-1">
                    {trainer.rating}/5
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiClock className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Classes Assigned
                </p>
                <p className="text-sm text-gray-600">
                  {trainer.classes} classes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {trainer.classes}
              </div>
              <div className="text-sm text-blue-600">Classes This Month</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {trainer.rating}
              </div>
              <div className="text-sm text-green-600">Average Rating</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">95%</div>
              <div className="text-sm text-purple-600">Attendance Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <SmartButton variant="secondary" size="sm" onClick={onClose}>
          <FiX className="h-4 w-4 mr-2" />
          Close
        </SmartButton>

        <SmartButton variant="secondary" size="sm" onClick={handleMessage}>
          <FiMessageSquare className="h-4 w-4 mr-2" />
          Send Message
        </SmartButton>

        <SmartButton variant="primary" size="sm" onClick={handleEdit}>
          <FiEdit className="h-4 w-4 mr-2" />
          Edit Profile
        </SmartButton>
      </div>
    </ColorfulModalUI>
  );
}
