import React, { useState, useEffect } from 'react';
import { FiUsers, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw, FiMapPin } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { realtimeService } from '../../services/realtimeService';

interface ClassMember {
  id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  status: 'booked' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  check_in_time?: string;
  check_out_time?: string;
  booking_time: string;
}

interface ClassDetails {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  current_bookings: number;
  room?: string;
  trainer_name: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface LiveClassRosterProps {
  classId: string;
  isTrainerView?: boolean;
}

export const LiveClassRoster: React.FC<LiveClassRosterProps> = ({ 
  classId, 
  isTrainerView = false 
}) => {
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [roster, setRoster] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { tenantId, userMetadata } = useAuth();

  // Fetch initial data
  useEffect(() => {
    if (classId && tenantId) {
      fetchClassDetails();
      fetchRoster();
    }
  }, [classId, tenantId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!classId || !tenantId) return;

    // Subscribe to booking changes
    const bookingSubscription = supabase
      .channel(`class_roster_${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_bookings',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          handleRosterUpdate(payload);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // Subscribe to class updates
    const classSubscription = supabase
      .channel(`class_details_${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'classes',
          filter: `id=eq.${classId}`
        },
        (payload) => {
          updateClassDetails(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      bookingSubscription.unsubscribe();
      classSubscription.unsubscribe();
    };
  }, [classId, tenantId]);

  const fetchClassDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          trainers(first_name, last_name)
        `)
        .eq('id', classId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;

      setClassDetails({
        ...data,
        trainer_name: `${data.trainers.first_name} ${data.trainers.last_name}`
      });
    } catch (err) {
      setError('Failed to load class details');
      console.error(err);
    }
  };

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          members(first_name, last_name, email)
        `)
        .eq('class_id', classId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedRoster: ClassMember[] = data?.map(booking => ({
        id: booking.id,
        member_id: booking.member_id,
        member_name: `${booking.members.first_name} ${booking.members.last_name}`,
        member_email: booking.members.email,
        status: booking.status,
        check_in_time: booking.check_in_time,
        check_out_time: booking.check_out_time,
        booking_time: booking.created_at
      })) || [];

      setRoster(formattedRoster);
    } catch (err) {
      setError('Failed to load class roster');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRosterUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // New booking - fetch member details and add to roster
      fetchMemberForBooking(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      // Update existing booking
      setRoster(prev => prev.map(member => 
        member.id === payload.new.id 
          ? { ...member, ...payload.new }
          : member
      ));
    } else if (payload.eventType === 'DELETE') {
      // Remove booking
      setRoster(prev => prev.filter(member => member.id !== payload.old.id));
    }
  };

  const fetchMemberForBooking = async (booking: any) => {
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('first_name, last_name, email')
        .eq('id', booking.member_id)
        .single();

      if (memberData) {
        const newMember: ClassMember = {
          id: booking.id,
          member_id: booking.member_id,
          member_name: `${memberData.first_name} ${memberData.last_name}`,
          member_email: memberData.email,
          status: booking.status,
          check_in_time: booking.check_in_time,
          check_out_time: booking.check_out_time,
          booking_time: booking.created_at
        };

        setRoster(prev => [...prev, newMember]);
      }
    } catch (error) {
      console.error('Failed to fetch member details:', error);
    }
  };

  const updateClassDetails = (updatedClass: any) => {
    setClassDetails(prev => prev ? { ...prev, ...updatedClass } : null);
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({
          status: 'checked_in',
          check_in_time: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to check in member:', error);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({
          status: 'completed',
          check_out_time: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to check out member:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'no_show': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in': return <FiCheckCircle className="h-4 w-4" />;
      case 'completed': return <FiCheckCircle className="h-4 w-4" />;
      case 'cancelled': return <FiXCircle className="h-4 w-4" />;
      case 'no_show': return <FiXCircle className="h-4 w-4" />;
      default: return <FiClock className="h-4 w-4" />;
    }
  };

  const getClassStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const stats = {
    total: roster.length,
    checkedIn: roster.filter(m => m.status === 'checked_in').length,
    completed: roster.filter(m => m.status === 'completed').length,
    noShows: roster.filter(m => m.status === 'no_show').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
        <div className="text-red-600 text-center">
          <FiXCircle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchClassDetails();
              fetchRoster();
            }}
            className="mt-2 text-red-500 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Class Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{classDetails?.name}</h3>
            <p className="text-gray-600 text-sm">{classDetails?.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getClassStatusColor(classDetails?.status || 'scheduled')}`}></div>
            <span className="text-sm font-medium capitalize">{classDetails?.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FiClock className="h-4 w-4 text-gray-500" />
            <span>{new Date(classDetails?.start_time || '').toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiMapPin className="h-4 w-4 text-gray-500" />
            <span>{classDetails?.room || 'Main Floor'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiUsers className="h-4 w-4 text-gray-500" />
            <span>{stats.total}/{classDetails?.capacity}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiRefreshCw className="h-4 w-4 text-gray-500" />
            <span>Updated {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Booked</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
            <p className="text-xs text-green-600">Checked In</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            <p className="text-xs text-blue-600">Completed</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.noShows}</p>
            <p className="text-xs text-orange-600">No Shows</p>
          </div>
        </div>
      </div>

      {/* Roster List */}
      <div className="p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {roster.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiUsers className="h-8 w-8 mx-auto mb-2" />
              <p>No members booked for this class</p>
            </div>
          ) : (
            roster.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(member.status)}`}>
                    {getStatusIcon(member.status)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{member.member_name}</h4>
                    <p className="text-sm text-gray-600">{member.member_email}</p>
                    {member.check_in_time && (
                      <p className="text-xs text-green-600">
                        Checked in: {new Date(member.check_in_time).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons for Trainers */}
                {isTrainerView && userMetadata?.role === 'trainer' && (
                  <div className="flex space-x-2">
                    {member.status === 'booked' && (
                      <button
                        onClick={() => handleCheckIn(member.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Check In
                      </button>
                    )}
                    {member.status === 'checked_in' && (
                      <button
                        onClick={() => handleCheckOut(member.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                )}

                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                    {member.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Booked: {new Date(member.booking_time).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 