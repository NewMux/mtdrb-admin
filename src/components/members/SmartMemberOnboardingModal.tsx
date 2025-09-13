import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FiUser,
  FiTarget,
  FiUpload,
  FiCheck,
  FiX,
  FiActivity,
  FiShield,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { SmartModal } from "../ui/SmartModal";
import { SmartButton } from "../ui/DesignSystem";
import toast from "react-hot-toast";

// Simplified schema
const schema = z.object({
  name: z.string().min(1, "Full Name is required"),
  age: z.coerce
    .number()
    .min(16, "Must be at least 16 years old")
    .max(100, "Invalid age"),
  gender: z.enum(["Male", "Female", "Other"]),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  fitnessGoal: z.enum([
    "Weight Loss",
    "Muscle Gain",
    "General Fitness",
    "Athletic Performance",
    "Rehabilitation",
    "Stress Relief",
  ]),
  idDocument: z.any().optional(),
  injuries: z.string().optional(),
  staffNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SmartMemberOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: any) => void;
}

const SmartMemberOnboardingModal: React.FC<SmartMemberOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const fitnessGoal = watch("fitnessGoal");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setValue("idDocument", file);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const memberData = {
        ...data,
        id: Date.now().toString(),
        joinDate: new Date().toISOString(),
        status: "active",
        lastCheckIn: new Date().toISOString(),
        checkInCount: 0,
        formsSubmitted: uploadedFile ? ["id_document"] : [],
        isTrial: false,
        membershipPrice: 0,
      };
      toast.success("Member created successfully! 🎉");
      onSuccess(memberData);
      onClose();
    } catch (error) {
      toast.error("Failed to create member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => {
    return errors[field as keyof typeof errors]?.message;
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Member"
      subtitle="Create a new member"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-end w-full">
          <SmartButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5"
          >
            Cancel
          </SmartButton>
          <SmartButton
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
            disabled={!isValid || !uploadedFile}
            className="px-6 py-2.5 ml-3"
          >
            {loading ? "Creating..." : "Create Member"}
          </SmartButton>
        </div>
      }
    >
      <form
        className="space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }}
      >
        {/* Basic Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiUser className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Member's personal details
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter full name"
                  />
                )}
              />
              {getError("name") && (
                <p className="text-red-500 text-sm mt-1">{getError("name")}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Age *
              </label>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter age"
                  />
                )}
              />
              {getError("age") && (
                <p className="text-red-500 text-sm mt-1">{getError("age")}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender *
              </label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                )}
              />
              {getError("gender") && (
                <p className="text-red-500 text-sm mt-1">
                  {getError("gender")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="+973 3xxxxxxx"
                  />
                )}
              />
              {getError("phone") && (
                <p className="text-red-500 text-sm mt-1">{getError("phone")}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email (Optional)
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="your.email@example.com"
                  />
                )}
              />
              {getError("email") && (
                <p className="text-red-500 text-sm mt-1">{getError("email")}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Fitness Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiTarget className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fitness Goals
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select primary fitness objective
              </p>
            </div>
          </div>
          <Controller
            name="fitnessGoal"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    value: "Weight Loss",
                    icon: "⚖️",
                    description: "Lose weight and get leaner",
                  },
                  {
                    value: "Muscle Gain",
                    icon: "💪",
                    description: "Build muscle and strength",
                  },
                  {
                    value: "General Fitness",
                    icon: "🏃",
                    description: "Stay healthy and active",
                  },
                  {
                    value: "Athletic Performance",
                    icon: "🏆",
                    description: "Improve sports performance",
                  },
                  {
                    value: "Rehabilitation",
                    icon: "🩺",
                    description: "Recover from injury",
                  },
                  {
                    value: "Stress Relief",
                    icon: "🧘",
                    description: "Reduce stress and relax",
                  },
                ].map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => field.onChange(goal.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      field.value === goal.value
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {goal.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {goal.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          />
          {getError("fitnessGoal") && (
            <p className="text-red-500 text-sm mt-1">
              {getError("fitnessGoal")}
            </p>
          )}
        </motion.div>

        {/* Medical Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FiActivity className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Medical Info
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Injuries, medical conditions, and staff notes
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Injuries / Medical Conditions
              </label>
              <Controller
                name="injuries"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe any injuries or medical conditions..."
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Staff Notes
              </label>
              <Controller
                name="staffNotes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add any notes for staff..."
                  />
                )}
              />
            </div>
          </div>
        </motion.div>

        {/* Document Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FiUpload className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Document Upload
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload ID for verification
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID Document *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploadedFile ? (
                  <div className="space-y-2">
                    <FiCheck className="w-8 h-8 text-green-500 mx-auto" />
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      File uploaded successfully
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FiUpload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </motion.div>
      </form>
    </SmartModal>
  );
};

export default SmartMemberOnboardingModal;
