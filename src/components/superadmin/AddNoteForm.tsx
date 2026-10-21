import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { SmartButton } from "../ui";
import { addNote } from "../../api/platformAdmin";

export default function AddNoteForm({
  tenantId,
  onAdded,
}: {
  tenantId: string;
  onAdded: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await addNote(tenantId, note);
      setNote("");
      toast.success("Note saved");
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="platform-note" className="sr-only">
        Internal note
      </label>
      <textarea
        id="platform-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder="Internal note (only platform admins can see this)"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex justify-end">
        <SmartButton type="submit" size="sm" variant="secondary" loading={saving} disabled={!note.trim()}>
          Add note
        </SmartButton>
      </div>
    </form>
  );
}
