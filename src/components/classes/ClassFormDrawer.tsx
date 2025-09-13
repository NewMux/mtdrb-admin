import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import { useUI } from "../../contexts/UIContext";
import {
  AppleStyleModal,
  AppleInput,
  AppleSelect,
  AppleTextarea,
  AppleToggle,
  AppleButton,
  AppleButtonGroup,
} from "../AppleStyleModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiTarget,
  FiHeart,
  FiFileText,
} from "react-icons/fi";
import { SmartClassModal } from "./modals/SmartClassModal";
import { SmartButton } from "../ui/DesignSystem";

interface ClassFormDrawerProps {
  isOpen: boolean;
  mode: "add" | "edit";
  classData?: any;
  onClose: () => void;
  onSaved?: () => void;
}

const classTypes = [
  { value: "Strength", label: "Strength" },
  { value: "Yoga", label: "Yoga" },
  { value: "Cardio", label: "Cardio" },
  { value: "HIIT", label: "HIIT" },
  { value: "Spin", label: "Spin" },
];
const durations = [30, 45, 60, 75, 90];
const repeatPatterns = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "mon_wed_fri", label: "Mon/Wed/Fri" },
  { value: "custom", label: "Custom" },
];
const rooms = [
  { value: "studio_a", label: "Studio A" },
  { value: "outdoor", label: "Outdoor Zone" },
];
const tagsList = [
  "Beginner-friendly",
  "High-Intensity",
  "Mobility",
  "Core",
  "Cardio",
];

const schema = z.object({
  name: z.string().min(1, "Class name is required"),
  type: z.string().min(1, "Class type is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.coerce.number().min(1, "Duration is required"),
  repeat: z.boolean(),
  repeat_pattern: z.string().optional(),
  repeat_end: z.string().optional(),
  repeat_sessions: z.coerce.number().optional(),
  trainer_id: z.string().min(1, "Trainer is required"),
  branch: z.string().min(1, "Branch is required"),
  room: z.string().optional(),
  capacity: z.coerce.number().min(1, "Capacity is required"),
  allow_waitlist: z.boolean().optional(),
  auto_cancel: z.boolean().optional(),
  is_paid: z.boolean(),
  price: z.coerce.number().optional(),
  visible: z.boolean(),
  notes: z.string().optional(),
  files: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface TrainerOption {
  id: string;
  name: string;
}
interface BranchOption {
  id: string;
  name: string;
}

const COLOR_SWATCHES = [
  "#2563eb", // blue
  "#22c55e", // green
  "#f59e42", // orange
  "#ef4444", // red
  "#a855f7", // purple
  "#fbbf24", // yellow
  "#14b8a6", // teal
  "#64748b", // gray
];

const ClassFormDrawer: React.FC<ClassFormDrawerProps> = ({
  isOpen,
  mode,
  classData,
  onClose,
  onSaved,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    classData?.tags || [],
  );
  const [fileList, setFileList] = useState<File[]>([]);
  const [color, setColor] = useState<string>(classData?.color || "#2563eb");
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [roomConflictWarning, setRoomConflictWarning] = useState<string | null>(
    null,
  );
  const [checkingRoomConflict, setCheckingRoomConflict] = useState(false);
  const { setDrawerOpen, drawerOpen } = useUI();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: classData || {
      name: "",
      type: "",
      description: "",
      color: "#2563eb",
      start_date: "",
      time: "",
      duration: 60,
      repeat: false,
      repeat_pattern: "",
      repeat_end: "",
      repeat_sessions: undefined,
      trainer_id: "",
      branch: "",
      room: "",
      capacity: 10,
      allow_waitlist: false,
      auto_cancel: false,
      is_paid: false,
      price: undefined,
      visible: true,
      notes: "",
      files: undefined,
      tags: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        classData || {
          name: "",
          type: "",
          description: "",
          color: "#2563eb",
          start_date: "",
          time: "",
          duration: 60,
          repeat: false,
          repeat_pattern: "",
          repeat_end: "",
          repeat_sessions: undefined,
          trainer_id: "",
          branch: "",
          room: "",
          capacity: 10,
          allow_waitlist: false,
          auto_cancel: false,
          is_paid: false,
          price: undefined,
          visible: true,
          notes: "",
          files: undefined,
          tags: [],
        },
      );
      setSelectedTags(classData?.tags || []);
      setColor(classData?.color || "#2563eb");
      setFileList([]);
      // Fetch trainers and branches
      fetchDropdownData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classData, reset]);

  useEffect(() => {
    setDrawerOpen(isOpen);
    return () => setDrawerOpen(false);
  }, [isOpen, setDrawerOpen]);

  // Fetch trainers and branches for the current tenant
  const fetchDropdownData = async () => {
    setLoadingDropdowns(true);
    setDropdownError(null);
    try {
      // Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");
      // Get tenant ID
      let tenantId = session.user.user_metadata?.tenantId;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", session.user.id)
          .single();
        if (membershipData) tenantId = membershipData.tenant_id;
      }
      if (!tenantId) throw new Error("No tenant ID found");
      // Fetch trainers
      const { data: trainersData, error: trainersError } = await supabase
        .from("trainers")
        .select("id, name")
        .eq("tenant_id", tenantId);
      if (trainersError) throw trainersError;
      setTrainers(trainersData || []);
      // Fetch branches
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("id, name")
        .eq("tenant_id", tenantId);
      if (branchesError) throw branchesError;
      setBranches(branchesData || []);
    } catch (err: any) {
      setDropdownError(err.message || "Failed to load dropdown data");
      setTrainers([]);
      setBranches([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Watchers for dynamic fields
  const repeat = watch("repeat");
  const is_paid = watch("is_paid");
  const trainer_id = watch("trainer_id");
  const start_date = watch("start_date");
  const time = watch("time");
  const duration = watch("duration");
  const branch = watch("branch");
  const room = watch("room");

  // Trainer availability/booking conflict check
  useEffect(() => {
    const checkConflict = async () => {
      setConflictWarning(null);
      if (!trainer_id || !start_date || !time || !duration) return;
      setCheckingConflict(true);
      try {
        // Calculate start and end time for the new class
        const startTime = new Date(`${start_date}T${time}`);
        const endTime = new Date(
          startTime.getTime() + Number(duration) * 60000,
        );
        // Query for overlapping classes for this trainer
        const { data: conflicts, error } = await supabase
          .from("classes")
          .select("id, name, starttime, duration")
          .eq("trainer_id", trainer_id)
          .neq("id", classData?.id || "") // Exclude current class in edit mode
          .gte(
            "starttime",
            new Date(startTime.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          ) // look back 2h for safety
          .lte(
            "starttime",
            new Date(endTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          ); // look ahead 2h for safety
        if (error) throw error;
        if (conflicts && conflicts.length > 0) {
          // Check for actual overlap
          for (const c of conflicts) {
            const cStart = new Date(c.starttime);
            const cEnd = new Date(
              cStart.getTime() + (c.duration || 60) * 60000,
            );
            if (startTime < cEnd && endTime > cStart) {
              setConflictWarning(
                `Trainer is already booked for "${c.name}" from ${cStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${cEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on this date.`,
              );
              setCheckingConflict(false);
              return;
            }
          }
        }
        setConflictWarning(null);
      } catch (err: any) {
        setConflictWarning("Could not check trainer availability.");
      } finally {
        setCheckingConflict(false);
      }
    };
    checkConflict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainer_id, start_date, time, duration, classData?.id]);

  // Room availability/booking conflict check
  useEffect(() => {
    const checkRoomConflict = async () => {
      setRoomConflictWarning(null);
      if (!branch || !room || !start_date || !time || !duration) return;
      setCheckingRoomConflict(true);
      try {
        const startTime = new Date(`${start_date}T${time}`);
        const endTime = new Date(
          startTime.getTime() + Number(duration) * 60000,
        );
        // Query for overlapping classes in this branch/room
        const { data: conflicts, error } = await supabase
          .from("classes")
          .select("id, name, starttime, duration")
          .eq("branch_id", branch)
          .eq("room", room)
          .neq("id", classData?.id || "")
          .gte(
            "starttime",
            new Date(startTime.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          )
          .lte(
            "starttime",
            new Date(endTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          );
        if (error) throw error;
        if (conflicts && conflicts.length > 0) {
          for (const c of conflicts) {
            const cStart = new Date(c.starttime);
            const cEnd = new Date(
              cStart.getTime() + (c.duration || 60) * 60000,
            );
            if (startTime < cEnd && endTime > cStart) {
              setRoomConflictWarning(
                `Room is already booked for "${c.name}" from ${cStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${cEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on this date.`,
              );
              setCheckingRoomConflict(false);
              return;
            }
          }
        }
        setRoomConflictWarning(null);
      } catch (err: any) {
        setRoomConflictWarning("Could not check room availability.");
      } finally {
        setCheckingRoomConflict(false);
      }
    };
    checkRoomConflict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, room, start_date, time, duration, classData?.id]);

  const handleTagToggle = (tag: string) => {
    let newTags;
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter((t) => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);
    setValue("tags", newTags);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileList(Array.from(e.target.files));
      setValue("files", e.target.files);
    }
  };

  const onSubmit = async (data: any) => {
    setSubmitLoading(true);
    setSubmitError(null);
    setUploadError(null);
    setUploadingFiles(false);
    try {
      // Get session and tenant ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");
      let tenantId = session.user.user_metadata?.tenantId;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", session.user.id)
          .single();
        if (membershipData) tenantId = membershipData.tenant_id;
      }
      if (!tenantId) throw new Error("No tenant ID found");

      // 1. Upload files if any
      let attachments: string[] = [];
      if (fileList.length > 0) {
        setUploadingFiles(true);
        for (const file of fileList) {
          const filePath = `classes/${tenantId}/${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("attachments")
              .upload(filePath, file, { upsert: true });
          if (uploadError) {
            setUploadError(`Failed to upload file: ${file.name}`);
            throw uploadError;
          }
          attachments.push(filePath);
        }
        setUploadingFiles(false);
      }

      // Map form data to DB fields
      const payload: any = {
        tenant_id: tenantId,
        name: data.name,
        type: data.type,
        description: data.description,
        color: data.color,
        starttime: data.start_date + "T" + data.time,
        duration: data.duration,
        capacity: data.capacity,
        trainer_id: data.trainer_id,
        branch_id: data.branch,
        room: data.room,
        allow_waitlist: data.allow_waitlist || false,
        auto_cancel: data.auto_cancel || false,
        is_paid: data.is_paid || false,
        price: data.is_paid ? data.price : null,
        visible: data.visible,
        notes: data.notes,
        tags: data.tags || [],
        color_tag: data.color,
        recurrence: data.repeat ? data.repeat_pattern : null,
        recurrence_end: data.repeat ? data.repeat_end : null,
        recurrence_sessions: data.repeat ? data.repeat_sessions : null,
        custom_fields: {},
        attachments,
      };

      let result;
      if (mode === "add") {
        result = await supabase.from("classes").insert(payload);
      } else if (mode === "edit" && classData?.id) {
        result = await supabase
          .from("classes")
          .update(payload)
          .eq("id", classData.id);
      }
      if (result?.error) throw result.error;
      toast.success(
        `Class ${mode === "add" ? "created" : "updated"} successfully!`,
      );
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save class");
    } finally {
      setSubmitLoading(false);
      setUploadingFiles(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title={mode === "add" ? "Add New Class" : "Edit Class"}
          subtitle="Create or update class information and schedule"
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="secondary" onClick={onClose}>
                Cancel
              </SmartButton>
              <SmartButton
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                loading={submitLoading}
              >
                {submitLoading
                  ? "Saving..."
                  : mode === "add"
                    ? "Create Class"
                    : "Update Class"}
              </SmartButton>
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Class Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Class Information
              </h3>

              <AppleInput
                label="Class Name"
                {...register("name")}
                error={errors.name?.message as string}
                required
                placeholder="Enter class name"
              />

              <AppleSelect
                label="Class Type"
                {...register("type")}
                error={errors.type?.message as string}
                required
              >
                <option value="">Select type</option>
                {classTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </AppleSelect>

              <AppleTextarea
                label="Description"
                {...register("description")}
                error={errors.description?.message as string}
                placeholder="Describe the class..."
                rows={3}
              />
            </div>

            {/* Color Tag */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Color Tag
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((swatchColor) => (
                  <button
                    key={swatchColor}
                    type="button"
                    onClick={() => {
                      setColor(swatchColor);
                      setValue("color", swatchColor);
                    }}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all duration-200
                      ${
                        color === swatchColor
                          ? "border-gray-900 scale-110 shadow-lg"
                          : "border-gray-200 hover:border-gray-400 hover:scale-105"
                      }
                    `}
                    style={{ backgroundColor: swatchColor }}
                  />
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Schedule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Start Date"
                  type="date"
                  {...register("start_date")}
                  error={errors.start_date?.message as string}
                  required
                />

                <AppleInput
                  label="Time"
                  type="time"
                  {...register("time")}
                  error={errors.time?.message as string}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Duration (minutes)"
                  type="number"
                  {...register("duration", { valueAsNumber: true })}
                  error={errors.duration?.message as string}
                  required
                  min={15}
                  max={480}
                />

                <div className="flex items-center justify-between">
                  <AppleToggle
                    label="Repeat Class"
                    checked={watch("repeat")}
                    onChange={(checked) => setValue("repeat", checked)}
                  />
                </div>
              </div>

              {watch("repeat") && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <AppleSelect
                    label="Repeat Pattern"
                    {...register("repeat_pattern")}
                    error={errors.repeat_pattern?.message as string}
                  >
                    <option value="">Select pattern</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </AppleSelect>

                  {/* Show custom repeat options if 'Custom' is selected */}
                  {watch("repeat_pattern") === "custom" && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mt-2">
                      <div className="text-blue-900 font-semibold mb-2">
                        Custom Repeat Options
                      </div>
                      <div className="text-blue-700 text-sm mb-2">
                        (Coming soon: select specific days, intervals, and
                        more!)
                      </div>
                      {/* Add custom fields here in the future */}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppleInput
                      label="End Date"
                      type="date"
                      {...register("repeat_end")}
                      error={errors.repeat_end?.message as string}
                    />

                    <AppleInput
                      label="Number of Sessions"
                      type="number"
                      {...register("repeat_sessions", { valueAsNumber: true })}
                      error={errors.repeat_sessions?.message as string}
                      min={1}
                      max={52}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location & Staff */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Location & Staff
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleSelect
                  label="Trainer"
                  {...register("trainer_id")}
                  error={errors.trainer_id?.message as string}
                  required
                >
                  <option value="">Select trainer</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
                </AppleSelect>

                <AppleSelect
                  label="Branch"
                  {...register("branch")}
                  error={errors.branch?.message as string}
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </AppleSelect>
              </div>

              <AppleInput
                label="Room/Area"
                {...register("room")}
                error={errors.room?.message as string}
                placeholder="e.g., Studio A, Main Gym"
              />
            </div>

            {/* Capacity & Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Capacity & Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Maximum Capacity"
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  error={errors.capacity?.message as string}
                  required
                  min={1}
                  max={100}
                />

                <div className="space-y-3">
                  <AppleToggle
                    label="Allow Waitlist"
                    checked={watch("allow_waitlist")}
                    onChange={(checked) => setValue("allow_waitlist", checked)}
                  />

                  <AppleToggle
                    label="Auto-cancel if Empty"
                    checked={watch("auto_cancel")}
                    onChange={(checked) => setValue("auto_cancel", checked)}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pricing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleToggle
                  label="Paid Class"
                  checked={watch("is_paid")}
                  onChange={(checked) => setValue("is_paid", checked)}
                />

                {watch("is_paid") && (
                  <AppleInput
                    label="Price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    error={errors.price?.message as string}
                    placeholder="0.00"
                  />
                )}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Settings
              </h3>

              <AppleToggle
                label="Visible to Members"
                checked={watch("visible")}
                onChange={(checked) => setValue("visible", checked)}
              />

              <AppleTextarea
                label="Notes"
                {...register("notes")}
                error={errors.notes?.message as string}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            {/* Error Display */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Warnings */}
            {conflictWarning && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-700">{conflictWarning}</p>
              </div>
            )}

            {roomConflictWarning && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-700">{roomConflictWarning}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="secondary" onClick={onClose}>
                Cancel
              </SmartButton>
              <SmartButton
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                loading={submitLoading}
              >
                {submitLoading
                  ? "Saving..."
                  : mode === "add"
                    ? "Create Class"
                    : "Update Class"}
              </SmartButton>
            </div>
          </form>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default ClassFormDrawer;
