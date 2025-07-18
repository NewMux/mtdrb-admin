import * as React from 'react';
import { SmartTrainerModal } from './SmartTrainerModal';
import { useSmartTrainerModal } from './useSmartTrainerModal';
import { FiLock, FiCalendar, FiUserCheck, FiUserX } from 'react-icons/fi';

interface UpdateTrainerStatusModalProps {
  open: boolean;
  onClose: () => void;
  trainerId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

export default function UpdateTrainerStatusModal({ open, onClose, trainerId, onSuccess, isPro }: UpdateTrainerStatusModalProps) {
  // Return null if trainerId is null or empty to prevent errors
  if (!trainerId) {
    return null;
  }

  const { loading, trainer, aiRecommendations, alerts, proLocked } = useSmartTrainerModal({ trainerId });
  const [status, setStatus] = React.useState('active');
  const [leaveDate, setLeaveDate] = React.useState('');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSuccess?.();
      onClose();
    }, 900);
  }

  React.useEffect(() => {
    if (trainer) setStatus(trainer.status || 'active');
  }, [trainer]);

  return (
    <SmartTrainerModal
      open={open}
      onClose={onClose}
      footer={
        <>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Update Status'}
          </button>
          <button
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </>
      }
    >
      <h2 className="text-xl font-semibold mb-4">Update Trainer Status</h2>
      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium ${a.type === 'error' ? 'bg-red-50 text-red-700' : a.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>{a.message}</div>
      ))}
      {/* Status Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {status === 'on_leave' && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 flex items-center gap-2"><FiCalendar /> Leave Until</label>
          <input
            type="date"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
            value={leaveDate}
            onChange={e => setLeaveDate(e.target.value)}
          />
        </div>
      )}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Note (optional)</label>
        <textarea
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 min-h-[60px]"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note..."
        />
      </div>
      {/* AI/Pro: Suggest backup trainers if On Leave */}
      {status === 'on_leave' && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FiLock className="text-gray-400" title="Pro feature" />
            <span className="font-semibold text-gray-900">Smart: Suggest backup trainers</span>
          </div>
          <div className="text-gray-500 text-sm">(Pro) AI will suggest available backup trainers for this period.</div>
        </div>
      )}
    </SmartTrainerModal>
  );
} 