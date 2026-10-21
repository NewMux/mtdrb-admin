import React, { useEffect, useId, useState } from "react";
import { toast } from "react-hot-toast";
import { SmartButton, UnifiedModal } from "../ui";

export interface ConfirmActionOption {
  label: string;
  hint?: string;
}

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the action succeeds so the caller can refetch / navigate. */
  onDone: () => void;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmLabel: string;
  successMessage: string;
  variant?: "danger" | "warning" | "primary";
  /** If set, the owner must type this exactly before the button enables. */
  confirmText?: string;
  /** Gym names are compared exactly by the database; emails ignore case. */
  caseSensitive?: boolean;
  /** An optional, off-by-default checkbox whose value is passed to `action`. */
  option?: ConfirmActionOption;
  action: (input: { reason: string; option: boolean }) => Promise<void>;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500";

/**
 * One confirmation dialog for every console action that changes or removes
 * something. It always asks for a reason (saved in the audit log) and, for
 * destructive actions, a typed confirmation. The database re-checks both, so
 * this only helps the owner act deliberately.
 */
export default function ConfirmActionModal({
  isOpen,
  onClose,
  onDone,
  title,
  subtitle,
  description,
  confirmLabel,
  successMessage,
  variant = "primary",
  confirmText,
  caseSensitive = false,
  option,
  action,
}: ConfirmActionModalProps) {
  const id = useId();
  const formId = `${id}-form`;
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [optionChecked, setOptionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setTyped("");
      setOptionChecked(false);
      setError(null);
    }
  }, [isOpen, title, subtitle]);

  const reasonOk = reason.trim().length >= 3;
  const typedOk =
    confirmText === undefined ||
    (caseSensitive
      ? typed.trim() === confirmText.trim()
      : typed.trim().toLowerCase() === confirmText.trim().toLowerCase());
  const canSubmit = reasonOk && typedOk && !saving;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await action({ reason, option: optionChecked });
      toast.success(successMessage);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn’t work. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      slideFrom="center"
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3">
          <SmartButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </SmartButton>
          <SmartButton type="submit" form={formId} variant={variant} loading={saving} disabled={!canSubmit}>
            {confirmLabel}
          </SmartButton>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4 text-start">
        <div className="text-sm text-gray-700 dark:text-gray-300">{description}</div>

        {option && (
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={optionChecked}
              onChange={(e) => setOptionChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
              {option.hint && <span className="mt-0.5 block text-gray-500 dark:text-gray-400">{option.hint}</span>}
            </span>
          </label>
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

        {confirmText !== undefined && (
          <div>
            <label htmlFor={`${id}-confirm`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <span className="font-semibold">{confirmText}</span> to confirm
            </label>
            <input
              id={`${id}-confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
      </form>
    </UnifiedModal>
  );
}
