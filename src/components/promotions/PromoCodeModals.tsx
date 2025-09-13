import React, { useState, useEffect } from "react";
import {
  FiX,
  FiGift,
  FiPercent,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiSettings,
  FiCheck,
  FiCopy,
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
  minimumPurchase?: number;
  firstTimeOnly: boolean;
  stackable: boolean;
}

interface PromoCodeModalsProps {
  createModalOpen: boolean;
  editModalOpen: boolean;
  selectedPromoCode: PromoCode | null;
  onCloseCreateModal: () => void;
  onCloseEditModal: () => void;
}

const PromoCodeModals: React.FC<PromoCodeModalsProps> = ({
  createModalOpen,
  editModalOpen,
  selectedPromoCode,
  onCloseCreateModal,
  onCloseEditModal,
}) => {
  const [formData, setFormData] = useState<Partial<PromoCode>>({
    code: "",
    type: "percentage",
    value: 0,
    maxUses: 100,
    expiryDate: "",
    targetSegment: "all",
    description: "",
    minimumPurchase: 0,
    firstTimeOnly: false,
    stackable: false,
  });
  const [errors, setErrors] = useState<Partial<PromoCode>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = editModalOpen && selectedPromoCode;
  const isOpen = createModalOpen || editModalOpen;

  useEffect(() => {
    if (isEditMode && selectedPromoCode) {
      setFormData({
        code: selectedPromoCode.code,
        type: selectedPromoCode.type,
        value: selectedPromoCode.value,
        maxUses: selectedPromoCode.maxUses,
        expiryDate: selectedPromoCode.expiryDate,
        targetSegment: selectedPromoCode.targetSegment || "all",
        description: selectedPromoCode.description || "",
        minimumPurchase: selectedPromoCode.minimumPurchase || 0,
        firstTimeOnly: selectedPromoCode.firstTimeOnly || false,
        stackable: selectedPromoCode.stackable || false,
      });
    } else if (createModalOpen) {
      setFormData({
        code: "",
        type: "percentage",
        value: 0,
        maxUses: 100,
        expiryDate: "",
        targetSegment: "all",
        description: "",
        minimumPurchase: 0,
        firstTimeOnly: false,
        stackable: false,
      });
    }
    setErrors({});
  }, [createModalOpen, editModalOpen, selectedPromoCode]);

  const generatePromoCode = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const prefixes = ["FIT", "GYM", "MTDRB", "HEALTH", "WORKOUT"];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const numbers = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      const newCode = `${prefix}${numbers}`;

      setFormData((prev) => ({ ...prev, code: newCode }));
      setIsGenerating(false);
      toast.success("Promo code generated!");
    }, 1000);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PromoCode> = {};

    if (!formData.code?.trim()) {
      newErrors.code = "Promo code is required";
    } else if (formData.code.length < 3) {
      newErrors.code = "Promo code must be at least 3 characters";
    }

    if (!formData.value || formData.value <= 0) {
      newErrors.value = "Value must be greater than 0";
    }

    if (formData.type === "percentage" && formData.value > 100) {
      newErrors.value = "Percentage cannot exceed 100%";
    }

    if (!formData.maxUses || formData.maxUses <= 0) {
      newErrors.maxUses = "Maximum uses must be greater than 0";
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.expiryDate = "Expiry date must be in the future";
      }
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isEditMode) {
        toast.success("Promo code updated successfully!");
        onCloseEditModal();
      } else {
        toast.success("Promo code created successfully!");
        onCloseCreateModal();
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PromoCode, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const copyToClipboard = () => {
    if (formData.code) {
      navigator.clipboard.writeText(formData.code);
      toast.success("Promo code copied to clipboard!");
    }
  };

  const targetSegments = [
    {
      value: "all",
      label: "All Members",
      description: "Available to everyone",
    },
    {
      value: "new",
      label: "New Members",
      description: "First-time customers only",
    },
    {
      value: "premium",
      label: "Premium Members",
      description: "Premium subscription holders",
    },
    {
      value: "inactive",
      label: "Inactive Members",
      description: "Members who haven't visited in 30+ days",
    },
    {
      value: "students",
      label: "Students",
      description: "Student discount program",
    },
    {
      value: "seniors",
      label: "Seniors",
      description: "Senior citizen discount",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <FiGift className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Promo Code" : "Create New Promo Code"}
              </h2>
              <p className="text-gray-600">
                {isEditMode
                  ? "Update your discount code settings"
                  : "Design discount codes to drive member engagement"}
              </p>
            </div>
          </div>
          <button
            onClick={isEditMode ? onCloseEditModal : onCloseCreateModal}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiGift className="h-5 w-5 text-purple-600 mr-2" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) =>
                      handleInputChange("code", e.target.value.toUpperCase())
                    }
                    className={`flex-1 px-4 py-3 border rounded-xl font-mono text-lg ${
                      errors.code
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-purple-500"
                    } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                    placeholder="e.g., NEWYEAR2024"
                    disabled={isEditMode}
                  />
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={generatePromoCode}
                      disabled={isGenerating}
                      className="px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </button>
                  )}
                  {formData.code && (
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                    >
                      <FiCopy className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-xl ${
                    errors.description
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-purple-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                  placeholder="e.g., New Year fitness challenge discount"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiPercent className="h-5 w-5 text-green-600 mr-2" />
              Discount Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value="percentage"
                      checked={formData.type === "percentage"}
                      onChange={(e) =>
                        handleInputChange("type", e.target.value)
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        Percentage
                      </div>
                      <div className="text-sm text-gray-500">e.g., 20% off</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value="flat"
                      checked={formData.type === "flat"}
                      onChange={(e) =>
                        handleInputChange("type", e.target.value)
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        Fixed Amount
                      </div>
                      <div className="text-sm text-gray-500">e.g., $50 off</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.value || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "value",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className={`w-full px-4 py-3 border rounded-xl ${
                      errors.value
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-purple-500"
                    } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                    placeholder={formData.type === "percentage" ? "20" : "50"}
                    min="0"
                    max={formData.type === "percentage" ? "100" : undefined}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {formData.type === "percentage" ? "%" : "$"}
                  </div>
                </div>
                {errors.value && (
                  <p className="text-red-500 text-sm mt-1">{errors.value}</p>
                )}
              </div>

              {/* Minimum Purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Purchase (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.minimumPurchase || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "minimumPurchase",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="0"
                    min="0"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage & Expiry */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiCalendar className="h-5 w-5 text-blue-600 mr-2" />
              Usage & Expiry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Maximum Uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses *
                </label>
                <input
                  type="number"
                  value={formData.maxUses || ""}
                  onChange={(e) =>
                    handleInputChange("maxUses", parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-3 border rounded-xl ${
                    errors.maxUses
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-purple-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                  placeholder="100"
                  min="1"
                />
                {errors.maxUses && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxUses}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) =>
                    handleInputChange("expiryDate", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-xl ${
                    errors.expiryDate
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-purple-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-200`}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expiryDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiTarget className="h-5 w-5 text-orange-600 mr-2" />
              Target Audience
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targetSegments.map((segment) => (
                <label
                  key={segment.value}
                  className="flex items-start space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="targetSegment"
                    value={segment.value}
                    checked={formData.targetSegment === segment.value}
                    onChange={(e) =>
                      handleInputChange("targetSegment", e.target.value)
                    }
                    className="text-purple-600 focus:ring-purple-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {segment.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {segment.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiSettings className="h-5 w-5 text-gray-600 mr-2" />
              Advanced Settings
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.firstTimeOnly || false}
                  onChange={(e) =>
                    handleInputChange("firstTimeOnly", e.target.checked)
                  }
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    First-time customers only
                  </div>
                  <div className="text-sm text-gray-500">
                    Limit to members who have never made a purchase
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.stackable || false}
                  onChange={(e) =>
                    handleInputChange("stackable", e.target.checked)
                  }
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    Stackable with other discounts
                  </div>
                  <div className="text-sm text-gray-500">
                    Allow this code to be used with other promotions
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={isEditMode ? onCloseEditModal : onCloseCreateModal}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiCheck className="h-5 w-5" />
                  <span>{isEditMode ? "Update Code" : "Create Code"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoCodeModals;
export { PromoCodeModals };
