import React, { useState } from "react";
import {
  FiUser,
  FiTarget,
  FiFileText,
  FiUpload,
  FiX,
  FiClock,
  FiAlertCircle,
  FiImage,
  FiFile,
  FiShield,
} from "react-icons/fi";
import { UnifiedModal } from "../ui/UnifiedModal";
import { SmartButton } from "../ui/DesignSystem";
import { AppleInput, AppleSelect, AppleTextarea } from "../AppleStyleModal";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AvailabilityDay {
  name: string;
  available: boolean;
  start_time: string;
  end_time: string;
}

interface TrainerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  address: string;
  specialty: string;
  experience_level: string;
  hourly_rate: string;
  status: string;
  certifications: string;
  education: string;
  bio: string;
  notes: string;
  availability: AvailabilityDay[];
}

interface FileUpload {
  file: File;
  preview?: string;
  name: string;
  type: "profile" | "certifications" | "national_id";
}

const initialFormData: TrainerFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  gender: "",
  date_of_birth: "",
  address: "",
  specialty: "",
  experience_level: "",
  hourly_rate: "",
  status: "active",
  certifications: "",
  education: "",
  bio: "",
  notes: "",
  availability: [
    {
      name: "Monday",
      available: false,
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      name: "Tuesday",
      available: false,
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      name: "Wednesday",
      available: false,
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      name: "Thursday",
      available: false,
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      name: "Friday",
      available: false,
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      name: "Saturday",
      available: false,
      start_time: "09:00",
      end_time: "17:00",
    },
    {
      name: "Sunday",
      available: false,
      start_time: "09:00",
      end_time: "17:00",
    },
  ],
};

const experienceLevels = [
  { value: "beginner", label: "Beginner (0-2 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "advanced", label: "Advanced (5-10 years)" },
  { value: "expert", label: "Expert (10+ years)" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

export function AddTrainerModal({ isOpen, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<TrainerFormData>(initialFormData);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<TrainerFormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof TrainerFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAvailabilityChange = (
    index: number,
    field: keyof AvailabilityDay,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.map((day, i) =>
        i === index ? { ...day, [field]: value } : day,
      ),
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: FileUpload["type"],
  ) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const fileUpload: FileUpload = {
          file,
          preview: type === "profile" ? preview : undefined,
          name: file.name,
          type,
        };

        setFileUploads((prev) => [...prev, fileUpload]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFileUpload = (index: number) => {
    setFileUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TrainerFormData> = {};

    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.specialty.trim())
      newErrors.specialty = "Specialty is required";
    if (!formData.experience_level.trim())
      newErrors.experience_level = "Experience level is required";
    if (!formData.hourly_rate.trim())
      newErrors.hourly_rate = "Hourly rate is required";
    if (parseFloat(formData.hourly_rate) <= 0)
      newErrors.hourly_rate = "Hourly rate must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("trainer-documents")
      .upload(`${path}/${Date.now()}-${file.name}`, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      // Upload files
      const uploadPromises = fileUploads.map(async (fileUpload) => {
        const path =
          fileUpload.type === "profile"
            ? "profile-images"
            : fileUpload.type === "certifications"
              ? "certifications"
              : "national-ids";
        const url = await uploadFile(fileUpload.file, path);
        return { type: fileUpload.type, url };
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Prepare trainer data
      const trainerData = {
        ...formData,
        name: `${formData.first_name} ${formData.last_name}`,
        profile_image_url: uploadResults.find((r) => r.type === "profile")?.url,
        certifications: uploadResults
          .filter((r) => r.type === "certifications")
          .map((r) => ({
            url: r.url,
            verified: false,
            uploaded_at: new Date().toISOString(),
          })),
        national_id_url: uploadResults.find((r) => r.type === "national_id")
          ?.url,
      };

      // Insert trainer data
      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .insert([trainerData])
        .select()
        .single();

      if (trainerError) throw trainerError;

      // Create trainer documents entry for national ID
      const nationalIdUpload = uploadResults.find(
        (r) => r.type === "national_id",
      );
      if (nationalIdUpload) {
        const { error: docError } = await supabase
          .from("trainer_documents")
          .insert([
            {
              trainer_id: trainer.id,
              document_type: "national_id",
              file_url: nationalIdUpload.url,
              status: "pending_verification",
            },
          ]);

        if (docError) throw docError;
      }

      toast.success("Trainer added successfully!");
      onSuccess?.();
      onClose();

      // Reset form
      setFormData(initialFormData);
      setFileUploads([]);
      setErrors({});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setSubmitError(message);
      toast.error("Failed to add trainer");
    } finally {
      setLoading(false);
    }
  };

  const getFileUploadsByType = (type: FileUpload["type"]) => {
    return fileUploads.filter((upload) => upload.type === type);
  };

  const footer = (
    <>
      <SmartButton
        variant="secondary"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </SmartButton>
      <SmartButton
        variant="primary"
        onClick={handleSubmit}
        loading={loading}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {loading ? "Adding Trainer..." : "Add Trainer"}
      </SmartButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Trainer"
      subtitle="Create a comprehensive trainer profile"
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              aria-label="First name"
              error={errors.first_name}
            />
            <AppleInput
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              aria-label="Last name"
              error={errors.last_name}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              aria-label="Email address"
              error={errors.email}
            />
            <AppleInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              aria-label="Phone number"
              error={errors.phone}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              aria-label="Date of birth"
            />
            <AppleSelect
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              aria-label="Gender"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </AppleSelect>
          </div>

          <AppleInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            aria-label="Address"
          />
        </section>

        {/* Professional Information Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <FiTarget className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Professional Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleInputChange}
              required
              aria-label="Specialty"
              error={errors.specialty}
            />
            <AppleSelect
              label="Experience Level"
              name="experience_level"
              value={formData.experience_level}
              onChange={handleInputChange}
              required
              aria-label="Experience level"
              error={errors.experience_level}
            >
              <option value="">Select experience level</option>
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </AppleSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Hourly Rate"
              name="hourly_rate"
              type="number"
              min="0"
              step="0.01"
              value={formData.hourly_rate}
              onChange={handleInputChange}
              required
              aria-label="Hourly rate"
              error={errors.hourly_rate}
            />
            <AppleSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              aria-label="Status"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </AppleSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Education"
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              aria-label="Education"
            />
            <AppleInput
              label="Certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleInputChange}
              aria-label="Certifications"
            />
          </div>
        </section>

        {/* Availability Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <FiClock className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Availability
            </h3>
          </div>

          <div className="space-y-4">
            {formData.availability.map((day, index) => (
              <div
                key={day.name}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`available-${index}`}
                    checked={day.available}
                    onChange={(e) =>
                      handleAvailabilityChange(index, "available", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:bg-gray-600"
                  />
                  <label
                    htmlFor={`available-${index}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    {day.name}
                  </label>
                </div>
                {day.available && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.start_time}
                      onChange={(e) =>
                        handleAvailabilityChange(index, "start_time", e.target.value)
                      }
                      className="px-3 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <input
                      type="time"
                      value={day.end_time}
                      onChange={(e) =>
                        handleAvailabilityChange(index, "end_time", e.target.value)
                      }
                      className="px-3 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* File Uploads Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiUpload className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Documents & Files
            </h3>
          </div>

          {/* Profile Image Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Profile Image
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "profile")}
                  className="hidden"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiImage className="h-4 w-4 mr-2" />
                  Upload Image
                </label>
                {getFileUploadsByType("profile").map((upload, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                  >
                    <FiImage className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">
                      {upload.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFileUpload(fileUploads.indexOf(upload))
                      }
                      className="text-red-500 hover:text-red-700"
                      aria-label="Remove profile image"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Certifications
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => handleFileUpload(e, "certifications")}
                  className="hidden"
                  id="certifications-upload"
                />
                <label
                  htmlFor="certifications-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiFile className="h-4 w-4 mr-2" />
                  Upload Certifications
                </label>
                {getFileUploadsByType("certifications").map((upload, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"
                  >
                    <FiFile className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">
                      {upload.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFileUpload(fileUploads.indexOf(upload))
                      }
                      className="text-red-500 hover:text-red-700"
                      aria-label="Remove certification file"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* National ID Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                National ID
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "national_id")}
                  className="hidden"
                  id="national-id-upload"
                />
                <label
                  htmlFor="national-id-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiShield className="h-4 w-4 mr-2" />
                  Upload National ID
                </label>
                {getFileUploadsByType("national_id").map((upload, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg"
                  >
                    <FiShield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">
                      {upload.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFileUpload(fileUploads.indexOf(upload))
                      }
                      className="text-red-500 hover:text-red-700"
                      aria-label="Remove national ID file"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Information Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600">
              <FiFileText className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Additional Information
            </h3>
          </div>

          <AppleTextarea
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            placeholder="Tell us about yourself, your training philosophy, and what makes you unique..."
            aria-label="Trainer biography"
          />

          <AppleTextarea
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Any additional notes or special requirements..."
            aria-label="Additional notes"
          />
        </section>

        {/* Error Display */}
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
            </div>
          </div>
        )}
      </form>
    </UnifiedModal>
  );
}

export default AddTrainerModal;
