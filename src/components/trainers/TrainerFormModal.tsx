import React, { useState } from "react";
import { SmartModal } from "../ui/SmartModal";
import { SmartButton } from "../ui/DesignSystem";
import { AppleInput, AppleSelect, AppleTextarea } from "../AppleStyleModal";
import { supabase } from "../../supabaseClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialValues?: any;
  isEdit?: boolean;
}

export default function TrainerFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialValues,
  isEdit,
}: Props) {
  interface TrainerFormData {
    name: string;
    email: string;
    phone: string;
    status: "active" | "inactive" | "busy" | "available";
    specialties: string[];
    bio: string;
    profile_image_url: string;
    address: string;
    specialization: string;
    experience: number;
    certifications: string;
    hourly_rate: number;
    start_date: string;
    notes: string;
  }

  const [formData, setFormData] = useState<TrainerFormData>({
    name: initialValues?.name ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    status: initialValues?.status ?? "active",
    specialties: initialValues?.specialties ?? [],
    bio: initialValues?.bio ?? "",
    profile_image_url: initialValues?.profile_image_url ?? "",
    address: initialValues?.address ?? "",
    specialization: initialValues?.specialization ?? "",
    experience: initialValues?.experience ?? 0,
    certifications: initialValues?.certifications ?? "",
    hourly_rate: initialValues?.hourly_rate ?? 0,
    start_date: initialValues?.start_date ?? "",
    notes: initialValues?.notes ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("trainers")
          .update(formData)
          .eq("id", initialValues.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("trainers").insert([formData]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Trainer" : "Add New Trainer"}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={error}
              required
              placeholder="Enter trainer name"
            />

            <AppleInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={error}
              placeholder="Enter email address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              error={error}
              placeholder="Enter phone number"
            />

            <AppleInput
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              error={error}
              placeholder="Enter address"
            />
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Professional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleSelect
              label="Specialization"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
              error={error}
            >
              <option value="">Select specialization</option>
              <option value="Strength Training">Strength Training</option>
              <option value="Cardio">Cardio</option>
              <option value="Yoga">Yoga</option>
              <option value="Pilates">Pilates</option>
              <option value="CrossFit">CrossFit</option>
              <option value="Nutrition">Nutrition</option>
              <option value="Rehabilitation">Rehabilitation</option>
              <option value="General Fitness">General Fitness</option>
            </AppleSelect>

            <AppleInput
              label="Experience (years)"
              type="number"
              value={formData.experience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experience: parseInt(e.target.value),
                })
              }
              error={error}
              min={0}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Certifications"
              value={formData.certifications}
              onChange={(e) =>
                setFormData({ ...formData, certifications: e.target.value })
              }
              error={error}
              placeholder="e.g., NASM, ACE, ISSA"
            />

            <AppleInput
              label="Hourly Rate (BHD)"
              type="number"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hourly_rate: parseFloat(e.target.value),
                })
              }
              error={error}
              placeholder="0.00"
            />
          </div>

          <AppleTextarea
            label="Bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            error={error}
            placeholder="Tell us about your background, experience, and approach to fitness..."
            rows={4}
          />
        </div>

        {/* Status & Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status & Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as TrainerFormData["status"],
                })
              }
              error={error}
            >
              <option value="">Select status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </AppleSelect>

            <AppleInput
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              error={error}
            />
          </div>

          <AppleTextarea
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            error={error}
            placeholder="Additional notes about the trainer..."
            rows={3}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <SmartButton variant="secondary" onClick={onClose}>
            Cancel
          </SmartButton>
          <SmartButton
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            {loading ? "Saving..." : isEdit ? "Update Trainer" : "Add Trainer"}
          </SmartButton>
        </div>
      </form>
    </SmartModal>
  );
}
