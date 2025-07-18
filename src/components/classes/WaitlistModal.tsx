import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiTarget, FiHeart, FiFileText, FiBell, FiX } from 'react-icons/fi';
import { SmartModal } from '../ui/SmartModal';
import { SmartButton } from '../ui/DesignSystem';
import { AppleInput } from '../AppleStyleModal';
import { Member } from '../../types/member';
import { toast } from 'react-hot-toast';

/**
 * Props for WaitlistModal
 */
interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: { id: string; name: string };
  waitlist: Array<{
    id: string;
    name: string;
    contact: string;
    addedAt: string;
  }>;
  onPromote: (memberId: string) => void;
  onRemove: (memberId: string) => void;
  onAdd: (member: Member) => void;
  onNotifyAll: () => void;
  members: Member[];
}

/** AppleAvatar utility for member avatars/initials */
const AppleAvatar: React.FC<{ name: string; avatarUrl?: string; size?: number }> = ({ name, avatarUrl, size = 36 }) => (
  avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg select-none"
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
);

/**
 * Staff-only Waitlist Modal for class management
 */
const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  classItem,
  waitlist,
  onPromote,
  onRemove,
  onAdd,
  onNotifyAll,
  members
}) => {
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ type: 'remove' | 'promote'; memberId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Filtered member suggestions
  const filteredMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      !waitlist.some(w => w.id === m.id)
  );

  // Keyboard navigation for dropdown
  const [highlighted, setHighlighted] = useState<number>(-1);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return;
    if (e.key === 'ArrowDown') {
      setHighlighted(h => Math.min(h + 1, filteredMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      setSelectedMember(filteredMembers[highlighted]);
      setDropdownOpen(false);
    }
  };

  // Add member handler
  const handleAdd = async () => {
    if (!selectedMember) return;
    setLoading(true);
    try {
      await onAdd(selectedMember);
      toast.success('Member added to waitlist');
      setSearch('');
      setSelectedMember(null);
    } catch (e) {
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // Confirm promote/remove
  const handleConfirm = async () => {
    if (!showConfirm) return;
    setLoading(true);
    try {
      if (showConfirm.type === 'remove') {
        await onRemove(showConfirm.memberId);
        toast.success('Removed from waitlist');
      } else {
        await onPromote(showConfirm.memberId);
        toast.success('Promoted to booking');
      }
      setShowConfirm(null);
    } catch (e) {
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  // Notify all handler
  const handleNotifyAll = async () => {
    setLoading(true);
    try {
      await onNotifyAll();
      toast.success('All waitlisted members notified');
    } catch (e) {
      toast.error('Failed to notify');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SmartModal isOpen={isOpen} onClose={onClose} title={`Waitlist for ${classItem.name}`} maxWidth="md">
      <div className="space-y-8">
        {/* Add to Waitlist */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FiUser className="text-blue-500" /> Add to Waitlist
          </h3>
          <div className="flex gap-2 mb-2">
            <AppleInput
              placeholder="Search member by name..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setDropdownOpen(true);
                setHighlighted(-1);
              }}
              className="flex-1 rounded-full px-5 py-3 text-base shadow-sm"
              autoFocus
              onKeyDown={handleKeyDown}
              aria-label="Search member by name"
            />
            <SmartButton
              onClick={handleAdd}
              variant="primary"
              disabled={!selectedMember || loading}
              loading={loading}
            >
              Add
            </SmartButton>
          </div>
          {/* Dropdown suggestions */}
          {dropdownOpen && search && (
            <div className="bg-white rounded-2xl border border-gray-100 max-h-48 overflow-y-auto shadow-lg mt-1 z-10">
              {filteredMembers.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm">No members found</div>
              ) : (
                filteredMembers.map((m, i) => (
                  <button
                    key={m.id}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 focus:bg-blue-100 transition text-left ${highlighted === i ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setSelectedMember(m);
                      setDropdownOpen(false);
                    }}
                    aria-selected={highlighted === i}
                  >
                    <AppleAvatar name={m.name} />
                    <span className="font-medium text-gray-900">{m.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{m.email || m.phone}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Waitlist Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FiUser className="text-green-500" /> Current Waitlist
            </h3>
            <span className="text-xs text-gray-500">{waitlist.length} waiting</span>
          </div>
          {waitlist.length === 0 ? (
            <div className="text-gray-500 text-sm">No members on the waitlist.</div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50">
              {waitlist.map(w => (
                <div key={w.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="flex items-center gap-3">
                    <AppleAvatar name={w.name} />
                    <div>
                      <div className="font-medium text-gray-900">{w.name}</div>
                      <div className="text-xs text-gray-500">{w.contact}</div>
                      {/* Status badge example: */}
                      {/* <span className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium">Active</span> */}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SmartButton
                      onClick={() => setShowConfirm({ type: 'promote', memberId: w.id })}
                      variant="primary"
                      size="sm"
                      aria-label="Promote to booking"
                      title="Promote to booking"
                    >
                      Promote
                    </SmartButton>
                    <SmartButton
                      onClick={() => setShowConfirm({ type: 'remove', memberId: w.id })}
                      variant="danger"
                      size="sm"
                      aria-label="Remove from waitlist"
                      title="Remove from waitlist"
                    >
                      <FiX />
                    </SmartButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notify All */}
        <div className="flex justify-end">
          <SmartButton
            variant="secondary"
            onClick={handleNotifyAll}
            icon={<FiBell className="mr-1" />}
            loading={loading}
          >
            Notify All
          </SmartButton>
        </div>

        {/* Confirm Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xs w-full flex flex-col items-center">
              <div className="mb-4">
                {showConfirm.type === 'remove' ? (
                  <FiX className="h-8 w-8 text-red-500" />
                ) : (
                  <FiUser className="h-8 w-8 text-green-500" />
                )}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {showConfirm.type === 'remove' ? 'Remove from waitlist?' : 'Promote to booking?'}
              </div>
              <div className="text-gray-500 text-sm mb-6">
                Are you sure you want to {showConfirm.type === 'remove' ? 'remove' : 'promote'} this member?
              </div>
              <div className="flex gap-3 w-full">
                <SmartButton variant="secondary" fullWidth onClick={() => setShowConfirm(null)}>
                  Cancel
                </SmartButton>
                <SmartButton
                  variant={showConfirm.type === 'remove' ? 'danger' : 'primary'}
                  fullWidth
                  onClick={handleConfirm}
                  loading={loading}
                >
                  Confirm
                </SmartButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};

export default WaitlistModal; 