import * as React from "react";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiTrash2, FiX, FiUser } from "react-icons/fi";
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

interface DeleteTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer;
  onSuccess?: () => void;
  isPro?: boolean;
}

export default function DeleteTrainerModal({
  isOpen,
  onClose,
  trainer,
  onSuccess,
  isPro = false,
}: DeleteTrainerModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(`${trainer.name} has been deleted successfully!`);
    setLoading(false);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <ColorfulModalUI
      open={isOpen}
      onClose={handleClose}
      onAction={handleDelete}
      actionLabel={loading ? "Deleting..." : "Delete Trainer"}
      actionVariant="danger"
      title="Delete Trainer"
      subtitle="This action cannot be undone"
    >
      <div className="space-y-6">
        {/* Warning Message */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiAlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-900 mb-1">
                Are you sure you want to delete this trainer?
              </h3>
              <p className="text-sm text-red-700 leading-relaxed">
                This will permanently remove <strong>{trainer.name}</strong> from the system and
                cannot be undone. All associated data will be lost.
              </p>
            </div>
          </div>
        </div>

        {/* Trainer Information */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center shadow-lg ring-2 ring-sky-100">
              <span className="text-white font-semibold text-base">
                {trainer.avatar}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{trainer.name}</h3>
              <p className="text-sm text-gray-600 font-medium">{trainer.email}</p>
              <p className="text-sm text-gray-600">{trainer.specialty}</p>
            </div>
          </div>
        </div>

        {/* Impact Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">This will affect:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <FiUser className="text-gray-400" />
              <span>{trainer.classes} assigned classes</span>
            </li>
            <li className="flex items-center gap-2">
              <FiUser className="text-gray-400" />
              <span>All trainer data and history</span>
            </li>
            <li className="flex items-center gap-2">
              <FiUser className="text-gray-400" />
              <span>Performance metrics and ratings</span>
            </li>
          </ul>
        </div>
      </div>

    </ColorfulModalUI>
  );
}
