import React, { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '../../supabaseClient';
import { SmartButton } from '../ui/DesignSystem';
import { FiUsers } from 'react-icons/fi';
import { Class } from '../../types';
import dayjs from 'dayjs';
import { createClassReview, getClassReviews } from '../../api/class';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Props for ClassDetailsDrawer
 */
interface ClassDetailsDrawerProps {
  isOpen: boolean;
  classData: Class;
  onClose: () => void;
  onEdit?: (classData: Class) => void;
  onRefresh?: () => void;
  onWaitlist?: (classData: Class) => void;
}

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'reviews', label: 'Reviews' },
];

/**
 * Apple-style drawer for viewing class details, bookings, and waitlist.
 * Includes Waitlist button for staff to manage class waitlist.
 */
const ClassDetailsDrawer: React.FC<ClassDetailsDrawerProps> = ({ isOpen, classData, onClose, onEdit, onRefresh, onWaitlist }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (isOpen && classData?.id) {
      fetchClassDetails();
      getClassReviews(classData.id).then(setReviews);
    } else {
      setBookings([]);
      setWaitlist([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classData?.id]);

  const fetchClassDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch bookings without member join
      const { data: bookingData, error: bookingError } = await supabase
        .from('class_bookings')
        .select('id, member_id, status, booked_at, attended, notes')
        .eq('class_id', classData.id)
        .order('booked_at', { ascending: true });
      if (bookingError) throw bookingError;

      // Fetch waitlist without member join
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('class_waitlist')
        .select('id, member_id, status, created_at')
        .eq('class_id', classData.id)
        .order('created_at', { ascending: true });
      if (waitlistError) throw waitlistError;

      // Get all unique member IDs
      const memberIds = [
        ...(bookingData || []).map(b => b.member_id),
        ...(waitlistData || []).map(w => w.member_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      // Fetch member details for all IDs
      let memberDetails: any[] = [];
      if (memberIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, name, email, phone')
          .in('id', memberIds);
        if (membersError) throw membersError;
        memberDetails = membersData || [];
      }

      // Create a map for quick member lookup
      const memberMap = new Map(memberDetails.map(m => [m.id, m]));

      // Combine booking data with member details
      const bookingsWithMembers = (bookingData || []).map(booking => ({
        ...booking,
        member: memberMap.get(booking.member_id) || null
      }));

      // Combine waitlist data with member details
      const waitlistWithMembers = (waitlistData || []).map(waitlist => ({
        ...waitlist,
        member: memberMap.get(waitlist.member_id) || null
      }));

      setBookings(bookingsWithMembers);
      setWaitlist(waitlistWithMembers);
    } catch (err: any) {
      setError(err.message || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const refreshDetails = async () => {
    await fetchClassDetails();
    if (typeof onRefresh === 'function') onRefresh();
  };

  const promoteWaitlist = async (waitlistEntry: any) => {
    if (!classData || bookings.length >= (classData.capacity || Infinity)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      // Add booking
      const { error: bookingError } = await supabase.from('class_bookings').insert({
        class_id: classData.id,
        member_id: waitlistEntry.member_id,
        status: 'booked',
      });
      if (bookingError) throw bookingError;
      // Remove from waitlist
      await supabase.from('class_waitlist').delete().eq('id', waitlistEntry.id);
      await refreshDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to promote waitlist member');
    } finally {
      setActionLoading(false);
    }
  };

  const removeBooking = async (booking: any) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await supabase.from('class_bookings').delete().eq('id', booking.id);
      await refreshDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove booking');
    } finally {
      setActionLoading(false);
    }
  };

  const removeWaitlist = async (waitlistEntry: any) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await supabase.from('class_waitlist').delete().eq('id', waitlistEntry.id);
      await refreshDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove waitlist entry');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    setReviewLoading(true);
    try {
      await createClassReview(classData.id, user.id, rating, comment);
      setComment('');
      setRating(5);
      setReviews(await getClassReviews(classData.id));
    } catch (e) {
      // handle error (toast, etc)
    } finally {
      setReviewLoading(false);
    }
  };

  // Utility to get class status and color
  function getClassStatus(cls: Class) {
    const now = dayjs();
    const start = dayjs(cls.start_time);
    const end = dayjs(cls.end_time);
    if ((cls as any).cancelled) return { label: 'Cancelled', color: 'bg-gray-300 text-gray-600' };
    if (now.isBefore(start)) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now.isAfter(end)) return { label: 'Completed', color: 'bg-green-100 text-green-700' };
    if (now.isAfter(start) && now.isBefore(end)) return { label: 'Live', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
  }

  if (!classData) return null;

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 overflow-hidden z-50" onClose={onClose}>
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={React.Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <Dialog.Title className="text-lg font-medium text-gray-900">
                  Class Profile
                </Dialog.Title>
                <div className="flex items-center gap-2">
                  {onWaitlist && (
                    <SmartButton
                      onClick={() => onWaitlist(classData)}
                      variant="secondary"
                      size="sm"
                      icon={<FiUsers className="mr-1" />}
                    >
                      Waitlist
                    </SmartButton>
                  )}
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close">
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>
              </div>
              {/* Tabs */}
              <div className="flex border-b bg-blue-50 px-6">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out ${
                      activeTab === 'details' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-b-2 border-blue-600 text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'details' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      {classData.name}
                      {/* Status badge */}
                      {(() => { const s = getClassStatus(classData); return (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
                      ); })()}
                    </h2>
                    <div className="flex items-center space-x-2 mb-2">
                      {classData.type && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">{classData.type}</span>}
                      {classData.color && <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: classData.color }} />}
                    </div>
                    {classData.description && <p className="text-gray-700 mb-2">{classData.description}</p>}
                  </div>
                )}
                {activeTab === 'bookings' && (
                  <div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Bookings</h3>
                        <span className="text-xs text-gray-500">{bookings.length} / {classData.capacity || '∞'} booked</span>
                      </div>
                      {loading ? (
                        <div className="text-gray-500 text-sm">Loading bookings...</div>
                      ) : error ? (
                        <div className="text-red-500 text-sm">{error}</div>
                      ) : bookings.length === 0 ? (
                        <div className="text-gray-500 text-sm">No bookings yet.</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {bookings.map((b) => (
                            <li key={b.id} className="py-2 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{b.member?.name || b.member_id}</div>
                                <div className="text-xs text-gray-500">{b.status} {b.attended ? '• Attended' : ''}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-xs text-gray-400">{b.booked_at ? new Date(b.booked_at).toLocaleString() : ''}</div>
                                <button
                                  className="ml-2 text-xs text-red-500 hover:underline"
                                  onClick={() => removeBooking(b)}
                                  disabled={actionLoading}
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'waitlist' && (
                  <div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Waitlist</h3>
                        <span className="text-xs text-gray-500">{waitlist.length} waiting</span>
                      </div>
                      {loading ? (
                        <div className="text-gray-500 text-sm">Loading waitlist...</div>
                      ) : error ? (
                        <div className="text-red-500 text-sm">{error}</div>
                      ) : waitlist.length === 0 ? (
                        <div className="text-gray-500 text-sm">No one on the waitlist.</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {waitlist.map((w) => (
                            <li key={w.id} className="py-2 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{w.member?.name || w.member_id}</div>
                                <div className="text-xs text-gray-500">{w.status}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {bookings.length < (classData.capacity || Infinity) && (
                                  <button
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={() => promoteWaitlist(w)}
                                    disabled={actionLoading}
                                  >
                                    Promote
                                  </button>
                                )}
                                <button
                                  className="text-xs text-red-500 hover:underline"
                                  onClick={() => removeWaitlist(w)}
                                  disabled={actionLoading}
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {actionError && <div className="text-red-500 text-xs mt-2">{actionError}</div>}
                    </div>
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Staff Reviews</h3>
                    <div className="flex items-center mb-2">
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          className={n <= rating ? 'text-yellow-400' : 'text-gray-300'}
                          onClick={() => setRating(n)}
                          type="button"
                        >★</button>
                      ))}
                    </div>
                    <textarea
                      className="w-full border rounded p-2 mb-2"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Add a comment (optional)"
                    />
                    <button
                      className="bg-blue-500 text-white rounded px-4 py-2"
                      onClick={handleReviewSubmit}
                      disabled={reviewLoading}
                    >
                      Submit Review
                    </button>
                    <div className="mt-4">
                      {reviews.length === 0 ? (
                        <p className="text-gray-500">No reviews yet.</p>
                      ) : (
                        reviews.map(r => (
                          <div key={r.id} className="border-b py-2">
                            <div className="flex items-center">
                              <span className="text-yellow-400 mr-2">{'★'.repeat(r.rating)}</span>
                              <span className="text-xs text-gray-400 ml-auto">{new Date(r.created_at).toLocaleString()}</span>
                            </div>
                            {r.comment && <div className="text-gray-700">{r.comment}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t px-6 py-4 flex justify-end space-x-2">
                {onEdit && (
                  <SmartButton
                    onClick={() => onEdit(classData)}
                    variant="primary"
                    size="sm"
                    icon={<FiEdit2 className="w-4 h-4" />}
                  >
                    Edit Class
                  </SmartButton>
                )}
                <button
                  className="inline-flex justify-center rounded-xl border border-transparent px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-300 ease-in-out min-h-[44px]"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ClassDetailsDrawer; 