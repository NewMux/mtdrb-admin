import * as React from "react";
import {
  FiCalendar,
  FiClock,
  FiSave,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";
import { supabase } from "../../../supabaseClient";

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

interface AssignClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer;
  onSuccess?: () => void;
  isPro?: boolean;
}

interface ClassAssignment {
  id: string;
  name: string;
  time: string;
  day: string;
  capacity: number;
  assigned: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AssignClassesModal({
  isOpen,
  onClose,
  trainer,
  onSuccess,
}: AssignClassesModalProps) {
  const [classes, setClasses] = React.useState<ClassAssignment[]>([]);
  const [fetching, setFetching] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedClasses, setSelectedClasses] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchClasses = async () => {
      setFetching(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        let tenantId = user.user_metadata?.tenant_id;
        if (!tenantId) {
          const { data: membershipData } = await supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();
          tenantId = membershipData?.tenant_id;
        }
        if (!tenantId) return;

        const { data, error } = await supabase
          .from("classes")
          .select("id, name, start_time, end_time, capacity, trainer_id")
          .eq("tenant_id", tenantId)
          .order("start_time", { ascending: true });
        if (error) throw error;
        if (cancelled) return;

        setClasses(
          (data || []).map((c) => {
            const start = new Date(c.start_time);
            return {
              id: c.id,
              name: c.name,
              time: start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              day: DAY_NAMES[start.getDay()],
              capacity: c.capacity,
              assigned: c.trainer_id === trainer.id,
            };
          }),
        );
      } catch (err) {
        console.error("Error fetching classes:", err);
        toast.error("Could not load classes");
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    void fetchClasses();
    return () => {
      cancelled = true;
    };
  }, [isOpen, trainer.id]);

  React.useEffect(() => {
    // Newly-selectable classes start unselected -- already-assigned classes
    // aren't included here since this modal can only add classes to this
    // trainer, not reassign them away (see handleToggleClass).
    setSelectedClasses([]);
  }, [classes]);

  const handleToggleClass = (classId: string) => {
    const target = classes.find((c) => c.id === classId);
    if (!target || target.assigned) return; // can't unassign via this modal
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId],
    );
  };

  const handleSubmit = async () => {
    if (selectedClasses.length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }
      if (!tenantId) throw new Error("No tenant found");

      const { error } = await supabase
        .from("classes")
        .update({ trainer_id: trainer.id })
        .in("id", selectedClasses)
        .eq("tenant_id", tenantId);
      if (error) throw error;

      toast.success(
        `${selectedClasses.length} class(es) assigned to ${trainer.name}!`,
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error assigning classes:", err);
      toast.error("Failed to assign classes");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <ColorfulModalUI
      open={isOpen}
      onClose={handleClose}
      title="Assign Classes"
      subtitle={`Assign classes to ${trainer.name}`}
    >
      <div className="space-y-6">
        {/* Trainer Info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {trainer.avatar}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
            <p className="text-sm text-gray-600">{trainer.specialty}</p>
            <p className="text-sm text-gray-600">
              Currently assigned: {classes.filter((c) => c.assigned).length}{" "}
              classes
            </p>
          </div>
        </div>

        {/* Available Classes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiCalendar className="text-blue-500" />
            Available Classes
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {fetching && (
              <p className="text-sm text-gray-500 py-4 text-center">
                Loading classes...
              </p>
            )}
            {!fetching && classes.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">
                No classes found for this gym yet.
              </p>
            )}
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  classItem.assigned
                    ? "border-green-200 bg-green-50 cursor-default"
                    : selectedClasses.includes(classItem.id)
                      ? "border-blue-500 bg-blue-50 cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                }`}
                onClick={() => handleToggleClass(classItem.id)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      classItem.assigned ||
                      selectedClasses.includes(classItem.id)
                    }
                    disabled={classItem.assigned}
                    onChange={() => handleToggleClass(classItem.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {classItem.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {classItem.time}
                      </span>
                      <span>{classItem.day}</span>
                      <span>Capacity: {classItem.capacity}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {classItem.assigned && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Currently Assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Assignment Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Selected Classes:</span>
              <span className="font-medium text-blue-900 ml-2">
                {selectedClasses.length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Total Hours:</span>
              <span className="font-medium text-blue-900 ml-2">
                {selectedClasses.length * 1.5}h
              </span>
            </div>
          </div>
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
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          loading={loading}
        >
          <FiSave className="h-4 w-4 mr-2" />
          {loading ? "Assigning..." : "Assign Classes"}
        </SmartButton>
      </div>
    </ColorfulModalUI>
  );
}
