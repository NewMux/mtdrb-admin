import React, { useEffect, useId, useState } from "react";
import { toast } from "react-hot-toast";
import { SmartButton, UnifiedModal } from "../ui";
import { inviteGym } from "../../api/platformAdmin";
import type { InviteGymResult, PlanTier } from "../../types/platformAdmin";
import {
  GRANT_DURATIONS,
  PLAN_TIER_OPTIONS,
  computeGrantUntil,
  formatDate,
  type GrantDurationKey,
} from "../../utils/platformAdmin";

// A new gym's free access is always time-limited here; "no expiry" and custom
// dates stay on the gym's own Grant access dialog.
const DURATIONS = GRANT_DURATIONS.filter((d) => d.key !== "custom" && d.key !== "none");

interface InviteGymModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (result: InviteGymResult) => void;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500";

/**
 * Creates a gym and emails its admin an invitation. The gym starts with free
 * (complimentary) access for the chosen plan and length; the invited person
 * sets their own password from the email link.
 */
export default function InviteGymModal({ isOpen, onClose, onDone }: InviteGymModalProps) {
  const id = useId();
  const [gymName, setGymName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<PlanTier>("pro");
  const [durationKey, setDurationKey] = useState<GrantDurationKey>("30d");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setGymName("");
    setEmail("");
    setTier("pro");
    setDurationKey("30d");
    setReason("");
    setError(null);
  }, [isOpen]);

  const until = computeGrantUntil(durationKey, "").until;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = gymName.trim().length > 0 && emailOk && reason.trim().length >= 3 && !saving;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const result = await inviteGym({ gymName, adminEmail: email, planTier: tier, until, reason });
      toast.success(`Invitation sent to ${result.email}`);
      onDone(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the invitation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite a gym"
      subtitle="Creates the gym and emails its admin"
      slideFrom="center"
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3">
          <SmartButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </SmartButton>
          <SmartButton type="submit" form={`${id}-form`} loading={saving} disabled={!canSubmit}>
            Send invitation
          </SmartButton>
        </div>
      }
    >
      <form id={`${id}-form`} onSubmit={submit} className="space-y-4 text-start">
        <div>
          <label htmlFor={`${id}-gym`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gym name
          </label>
          <input
            id={`${id}-gym`}
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            maxLength={160}
            autoComplete="off"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={`${id}-email`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Admin email
          </label>
          <input
            id={`${id}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="off"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Must be a new email. If that person already has an account, ask them to sign in instead.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-tier`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan
            </label>
            <select id={`${id}-tier`} value={tier} onChange={(e) => setTier(e.target.value as PlanTier)} className={inputClass}>
              {PLAN_TIER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                  {o.proFeatures ? "" : " (no Pro features)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-duration`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Free access for
            </label>
            <select
              id={`${id}-duration`}
              value={durationKey}
              onChange={(e) => setDurationKey(e.target.value as GrantDurationKey)}
              className={inputClass}
            >
              {DURATIONS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {until && (
          <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">Free access ends {formatDate(until)}.</p>
        )}

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
