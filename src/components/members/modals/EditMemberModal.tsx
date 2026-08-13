import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FiUser,
  FiTarget,
  FiUpload,
  FiCheck,
  FiActivity,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { Member } from "../../../types/member";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

type EditMemberForm = {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  email?: string;
  phone: string;
  fitnessGoal:
    | "Weight Loss"
    | "Muscle Gain"
    | "General Fitness"
    | "Athletic Performance"
    | "Rehabilitation"
    | "Stress Relief";
  injuries?: string;
  staffNotes?: string;
  idDocument?: File | null;
};

const buildSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("members.fullNameRequired")),
    age: z.coerce
      .number()
      .min(16, t("members.ageMinRequired"))
      .max(100, t("members.invalidAge")),
    gender: z.enum(["Male", "Female", "Other"]),
    email: z.string().email(t("members.invalidEmailAddress")).optional().or(z.literal("")),
    phone: z.string().min(1, t("members.phoneRequired")),
    fitnessGoal: z.enum([
      "Weight Loss",
      "Muscle Gain",
      "General Fitness",
      "Athletic Performance",
      "Rehabilitation",
      "Stress Relief",
    ]),
    injuries: z.string().optional(),
    staffNotes: z.string().optional(),
    idDocument: z.any().optional(),
  });

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  onSuccess: (
    memberId: string,
    memberData: Partial<Member>,
  ) => Promise<void>;
  loading?: boolean;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSuccess,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<EditMemberForm>({
    resolver: zodResolver(buildSchema(t)),
    mode: "onChange",
    defaultValues: {
      name: "",
      age: 18,
      gender: "Male",
      email: "",
      phone: "",
      fitnessGoal: "General Fitness",
      injuries: "",
      staffNotes: "",
      idDocument: null,
    },
  });

  useEffect(() => {
    if (isOpen && member) {
      reset({
        name: member.name || "",
        age: member.age || 18,
        gender: (member.gender as "Male" | "Female" | "Other") || "Male",
        email: member.email || "",
        phone: member.phone || "",
        fitnessGoal:
          (member.fitnessGoal as EditMemberForm["fitnessGoal"]) ||
          "General Fitness",
        injuries: Array.isArray(member.injuries)
          ? member.injuries.join(", ")
          : member.injuries || "",
        staffNotes: member.staffNotes || "",
        idDocument: null,
      });
      setUploadedFile(null);
    }
  }, [isOpen, member, reset]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setValue("idDocument", file);
    }
  };

  const onSubmit = async (data: EditMemberForm) => {
    setIsLoading(true);
    try {
      const injuries = data.injuries
        ? data.injuries
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;
      const updatedData: Partial<Member> = {
        ...data,
        injuries,
        idDocument: uploadedFile || undefined,
      };
      await onSuccess(member?.id || "", updatedData);
      onClose();
    } catch (error) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  const getError = (field: keyof EditMemberForm) => {
    return errors[field]?.message;
  };

  if (!member) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title={t("members.editMember")}
          subtitle={t("members.updateMemberInfo")}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <SmartButton
                variant="secondary"
                onClick={onClose}
                disabled={isLoading || loading}
                className="px-6 py-2.5"
              >
                {t("members.cancel", "إلغاء")}
              </SmartButton>
              <SmartButton
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                loading={isLoading || loading}
                disabled={!isValid}
                className="px-6 py-2.5"
              >
                {isLoading || loading ? t("members.updating", "جاري التحديث...") : t("members.updateMember", "تحديث بيانات العضو")}
              </SmartButton>
            </div>
          }
        >
          <form
            className="space-y-10 text-start"
            dir={isRTL ? "rtl" : "ltr"}
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
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <FiUser className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-start">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("members.basicInformation", "المعلومات الأساسية")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("members.personalDetails", "البيانات الشخصية للعضو")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-start">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("members.fullName", "الاسم الكامل")} *
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-start"
                        placeholder={t("members.enterFullName", "أدخل الاسم الكامل")}
                        dir={isRTL ? "rtl" : "ltr"}
                      />
                    )}
                  />
                  {getError("name") && (
                    <p className="text-red-500 text-sm mt-1">
                      {getError("name")}
                    </p>
                  )}
                </div>
                <div className="text-start">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("members.age", "العمر")} *
                  </label>
                  <Controller
                    name="age"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-start"
                        placeholder={t("members.enterAge", "أدخل العمر")}
                        dir={isRTL ? "rtl" : "ltr"}
                      />
                    )}
                  />
                  {getError("age") && (
                    <p className="text-red-500 text-sm mt-1">
                      {getError("age")}
                    </p>
                  )}
                </div>
                <div className="text-start">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("members.gender", "الجنس")} *
                  </label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-start"
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <option value="">{t("members.selectGender", "اختر الجنس")}</option>
                        <option value="Male">{t("members.male", "ذكر")}</option>
                        <option value="Female">{t("members.female", "أنثى")}</option>
                        <option value="Other">{t("members.other", "آخر")}</option>
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
                    {t("members.phoneNumber")} *
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
                    <p className="text-red-500 text-sm mt-1">
                      {getError("phone")}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("members.emailOptional")}
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
                    <p className="text-red-500 text-sm mt-1">
                      {getError("email")}
                    </p>
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
                    {t("members.fitnessGoals")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("members.fitnessGoalsDesc")}
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
                        label: t("members.goalWeightLoss"),
                        description: t("members.goalWeightLossDesc"),
                      },
                      {
                        value: "Muscle Gain",
                        icon: "💪",
                        label: t("members.goalMuscleGain"),
                        description: t("members.goalMuscleGainDesc"),
                      },
                      {
                        value: "General Fitness",
                        icon: "🏃",
                        label: t("members.goalGeneralFitness"),
                        description: t("members.goalGeneralFitnessDesc"),
                      },
                      {
                        value: "Athletic Performance",
                        icon: "🏆",
                        label: t("members.goalAthleticPerformance"),
                        description: t("members.goalAthleticPerformanceDesc"),
                      },
                      {
                        value: "Rehabilitation",
                        icon: "🩺",
                        label: t("members.goalRehabilitation"),
                        description: t("members.goalRehabilitationDesc"),
                      },
                      {
                        value: "Stress Relief",
                        icon: "🧘",
                        label: t("members.goalStressRelief"),
                        description: t("members.goalStressReliefDesc"),
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
                              {goal.label}
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
                    {t("members.medicalInformation")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("members.medicalInfoDesc")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("members.injuriesConditionsLabel")}
                  </label>
                  <Controller
                    name="injuries"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder={t("members.describeInjuriesPlaceholder")}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("members.staffNotes")}
                  </label>
                  <Controller
                    name="staffNotes"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder={t("members.staffNotesPlaceholder")}
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
                    {t("members.documentUpload")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("members.uploadIdForVerification")}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("members.idDocument")}
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload-edit"
                  />
                  <label htmlFor="file-upload-edit" className="cursor-pointer">
                    {uploadedFile ? (
                      <div className="space-y-2">
                        <FiCheck className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          {uploadedFile.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("members.fileUploadedSuccessfully")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FiUpload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-gray-600 dark:text-gray-400">
                          {t("members.clickToUploadOrDragDrop")}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("members.fileSizeLimit")}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </motion.div>
          </form>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default EditMemberModal;
