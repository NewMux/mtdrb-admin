import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { SmartButton, UnifiedModal } from "../ui";
import { grantAccess } from "../../api/platformAdmin";
import type { AccessState, PlanTier, SubscriptionSummary } from "../../types/platformAdmin";
import {
  GRANT_DURATIONS,
  PLAN_TIER_OPTIONS,
  computeGrantUntil,
  formatDate,
  hasPaddleHistory,
  validateGrantInput,
  type GrantDurationKey,
  type GrantErrors,
} from "../../utils/platformAdmin";

export interface GrantTarget {
  id: string;
  name: string;
  subscription: SubscriptionSummary | null;
  accessState: AccessState;
}

interface GrantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the grant succeeds so the caller can refetch. */
  onDone: () => void;
  tenant: GrantTarget;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500";

/**
 * Grants complimentary access (a manual subscription row). The database does
 * the real checking - this dialog only helps the owner choose deliberately:
 * only Pro/Enterprise unlock Pro features, "no expiry" needs a typed
 * confirmation, and a gym with Paddle history gets a warning.
 */
export default function GrantAccessModal({ isOpen, onClose, onDone, tenant }: GrantAccessModalProps) {
  const isChange = tenant.accessState === "complimentary";
  const [tier, setTier] = useState<PlanTier>("pro");
  const [durationKey, setDurationKey] = useState<GrantDurationKey>("30d");
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [errors, setErrors] = useState<GrantErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const current = tenant.subscription?.plan_tier;
    setTier(isChange && PLAN_TIER_OPTIONS.some((o) => o.value === current) ? (current as PlanTier) : "pro");
    setDurationKey("30d");
    setCustomDate("");
    setReason("");
    setConfirmName("");
    setErrors({});
    setServerError(null);
  }, [isOpen, tenant.id, tenant.subscription?.plan_tier, isChange]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateGrantInput({
      durationKey,
      customDate,
      reason,
      confirmName,
      tenantName: tenant.name,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { until } = computeGrantUntil(durationKey, customDate);
    setSaving(true);
    setServerError(null);
    try {
      await grantAccess({ tenantId: tenant.id, planTier: tier, until, reason });
      toast.success(
        until ? `${tenant.name} now has access until ${formatDate(until)}` : `${tenant.name} now has access with no expiry`,
      );
      onDone();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not grant access.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={isChange ? "Change complimentary access" : "Activate gym"}
      subtitle={tenant.name}
      slideFrom="center"
      maxWidth="lg"
      footer={
        <div className="flex justify-end gap-3">
          <SmartButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </SmartButton>
          <SmartButton type="submit" form="grant-access-form" loading={saving}>
            {isChange ? "Save access" : "Grant access"}
          </SmartButton>
        </div>
      }
    >
      <form id="grant-access-form" onSubmit={submit} noValidate className="space-y-5 text-start">
        {hasPaddleHistory(tenant.subscription) && (
          <p className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
            This gym has a Paddle subscription on record. Make sure it is cancelled in Paddle first — a
            late or retried Paddle event can overwrite a manual grant.
          </p>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</legend>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PLAN_TIER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                  tier === option.value
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="plan-tier"
                  value={option.value}
                  checked={tier === option.value}
                  onChange={() => setTier(option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {option.proFeatures ? "Includes Pro features" : "Active, but no Pro features"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Access lasts</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GRANT_DURATIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-pressed={durationKey === d.key}
                onClick={() => setDurationKey(d.key)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  durationKey === d.key
                    ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300"
                    : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {durationKey === "custom" && (
            <div className="mt-3">
              <label htmlFor="grant-custom-date" className="block text-sm text-gray-700 dark:text-gray-300">
                End date
              </label>
              <input
                id="grant-custom-date"
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          {durationKey === "none" && (
            <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                This gym keeps access until you revoke it. Type the gym name to confirm.
              </p>
              <label htmlFor="grant-confirm-name" className="sr-only">
                Gym name
              </label>
              <input
                id="grant-confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={tenant.name}
                autoComplete="off"
                className={inputClass}
              />
              {errors.confirmName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.confirmName}
                </p>
              )}
            </div>
          )}
          {errors.duration && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.duration}
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor="grant-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason (saved in the audit log)
          </label>
          <textarea
            id="grant-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="e.g. Founding customer — free for 90 days"
            className={inputClass}
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.reason}
            </p>
          )}
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {serverError}
          </p>
        )}
      </form>
    </UnifiedModal>
  );
}
