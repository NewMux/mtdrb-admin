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
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Trainer"
      subtitle="This action cannot be undone"
    >
      <div className="space-y-6">
        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Are you sure you want to delete this trainer?
              </h3>
              <p className="text-sm text-red-700 mt-1">
                This will permanently remove {trainer.name} from the system and
                cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Trainer Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {trainer.avatar}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
              <p className="text-sm text-gray-600">{trainer.email}</p>
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

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <SmartButton
          variant="secondary"
          size="sm"
          onClick={handleClose}
          disabled={loading}
        >
          <FiX className="h-4 w-4 mr-2" />
          Cancel
        </SmartButton>

        <SmartButton
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={loading}
        >
          <FiTrash2 className="h-4 w-4 mr-2" />
          {loading ? "Deleting..." : "Delete Trainer"}
        </SmartButton>
      </div>
    </ColorfulModalUI>
  );
}
