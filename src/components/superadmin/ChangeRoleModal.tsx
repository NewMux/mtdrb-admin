import React, { useEffect, useId, useState } from "react";
import { toast } from "react-hot-toast";
import { SmartButton, UnifiedModal } from "../ui";
import { changeUserRole } from "../../api/platformAdmin";
import type { GymRole } from "../../types/platformAdmin";

const ROLES: Array<{ value: GymRole; label: string; hint: string }> = [
  { value: "admin", label: "Admin", hint: "Full control of the gym, including billing and staff." },
  { value: "employee", label: "Employee", hint: "Front desk and day-to-day operations." },
  { value: "trainer", label: "Trainer", hint: "Classes and their own members." },
];

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
  tenant: { id: string; name: string };
  user: { id: string; email: string; role: string };
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500";

/** Changes one staff member's role in one gym. The database refuses to demote a gym's last admin. */
export default function ChangeRoleModal({ isOpen, onClose, onDone, tenant, user }: ChangeRoleModalProps) {
  const id = useId();
  const [role, setRole] = useState<GymRole>("employee");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const next = ROLES.find((r) => r.value !== user.role);
    setRole((next?.value ?? "employee") as GymRole);
    setReason("");
    setError(null);
  }, [isOpen, user.id, user.role]);

  const changed = role !== user.role;
  const canSubmit = changed && reason.trim().length >= 3 && !saving;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await changeUserRole({ tenantId: tenant.id, userId: user.id, role, reason });
      toast.success(`${user.email} is now ${role}`);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Change role"
      subtitle={`${user.email} · ${tenant.name}`}
      slideFrom="center"
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3">
          <SmartButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </SmartButton>
          <SmartButton type="submit" form={`${id}-form`} loading={saving} disabled={!canSubmit}>
            Change role
          </SmartButton>
        </div>
      }
    >
      <form id={`${id}-form`} onSubmit={submit} className="space-y-4 text-start">
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">New role</legend>
          <div className="mt-2 space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
              >
                <input
                  type="radio"
                  name={`${id}-role`}
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  disabled={r.value === user.role}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {r.label}
                    {r.value === user.role ? " (current)" : ""}
                  </span>
                  <span className="mt-0.5 block text-gray-500 dark:text-gray-400">{r.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${id}-reason`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason (saved in the audit log)
          </label>
          <textarea
            id={`${id}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            className={inputClass}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
      </form>
    </UnifiedModal>
  );
}
