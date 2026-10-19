import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { SmartButton, UnifiedModal } from "../ui";
import { revokeAccess } from "../../api/platformAdmin";

interface RevokeAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
  tenant: { id: string; name: string };
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500";

/** Ends manually granted access immediately. Needs the gym name typed to confirm. */
export default function RevokeAccessModal({ isOpen, onClose, onDone, tenant }: RevokeAccessModalProps) {
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setConfirmName("");
      setError(null);
    }
  }, [isOpen, tenant.id]);

  const nameMatches = confirmName.trim().toLowerCase() === tenant.name.trim().toLowerCase();
  const reasonOk = reason.trim().length >= 3;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameMatches || !reasonOk) return;
    setSaving(true);
    setError(null);
    try {
      await revokeAccess(tenant.id, reason);
      toast.success(`Access revoked for ${tenant.name}`);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke access.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke access"
      subtitle={tenant.name}
      slideFrom="center"
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3">
          <SmartButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </SmartButton>
          <SmartButton
            type="submit"
            form="revoke-access-form"
            variant="danger"
            loading={saving}
            disabled={!nameMatches || !reasonOk}
          >
            Revoke access
          </SmartButton>
        </div>
      }
    >
      <form id="revoke-access-form" onSubmit={submit} className="space-y-4 text-start">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This ends the gym’s complimentary access immediately. Their data is kept, and you can grant
          access again later.
        </p>
        <div>
          <label htmlFor="revoke-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason (saved in the audit log)
          </label>
          <textarea
            id="revoke-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="revoke-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type <span className="font-semibold">{tenant.name}</span> to confirm
          </label>
          <input
            id="revoke-confirm"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
      </form>
    </UnifiedModal>
  );
}
