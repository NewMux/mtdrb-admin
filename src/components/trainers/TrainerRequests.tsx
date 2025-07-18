import React, { useState, useEffect } from 'react';
import { FiCalendar, FiMessageSquare, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';

interface Request {
  id: string;
  trainer_id: string;
  type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  admin_notes: string | null;
  created_at: string;
  trainer: {
    name: string;
    email: string;
  };
}

interface AffectedClass {
  id: string;
  start_time: string;
  type: string;
  members_count: number;
}

export default function TrainerRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [affectedClasses, setAffectedClasses] = useState<AffectedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    type: '',
    status: '',
    trainer: ''
  });
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchTrainers();
    fetchRequests();
  }, [filter]);

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTrainers(data || []);
    } catch (err: any) {
      console.error('Error fetching trainers:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('trainer_requests')
        .select(`
          *,
          trainer:trainers (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter.type) {
        query = query.eq('type', filter.type);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.trainer) {
        query = query.eq('trainer_id', filter.trainer);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAffectedClasses = async (request: Request) => {
    if (!request.start_date || !request.end_date) return;

    try {
      const { data, error } = await supabase
        .from('trainer_schedule')
        .select(`
          id,
          start_time,
          type,
          members_count
        `)
        .eq('trainer_id', request.trainer_id)
        .gte('start_time', request.start_date)
        .lte('start_time', request.end_date)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;
      setAffectedClasses(data || []);
    } catch (err: any) {
      console.error('Error fetching affected classes:', err);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('trainer_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: action === 'approve'
            ? 'Request approved by admin'
            : 'Request rejected by admin'
        })
        .eq('id', requestId);

      if (error) throw error;

      // If this was a leave request and it was approved, update trainer schedule
      const request = requests.find(r => r.id === requestId);
      if (request?.type === 'leave' && action === 'approve' && request.start_date && request.end_date) {
        await supabase
          .from('trainer_schedule')
          .insert({
            trainer_id: request.trainer_id,
            type: 'leave',
            start_time: request.start_date,
            end_time: request.end_date,
            status: 'scheduled',
            notes: request.description
          });
      }

      fetchRequests();
    } catch (err: any) {
      console.error('Error handling request action:', err);
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return <FiCalendar className="h-5 w-5 text-blue-500" />;
      case 'complaint':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      case 'handover':
        return <FiMessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <FiMessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2">
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="leave">Leave</option>
            <option value="complaint">Complaint</option>
            <option value="handover">Handover</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filter.trainer}
            onChange={(e) => setFilter({ ...filter, trainer: e.target.value })}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Trainers</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
        {requests.map((request) => (
          <div key={request.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {getRequestTypeIcon(request.type)}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {request.trainer.name} - {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                  </h3>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}
                    >
                      {request.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRequestAction(request.id, 'approve')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiCheck className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequestAction(request.id, 'reject')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <FiX className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              {request.description}
            </div>

            {request.type === 'leave' && request.start_date && request.end_date && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500">Leave Period</div>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                </div>
              </div>
            )}

            {request.admin_notes && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500">Admin Notes</div>
                <div className="mt-1 text-sm text-gray-900">
                  {request.admin_notes}
                </div>
              </div>
            )}

            {request.type === 'leave' && request.status === 'pending' && (
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  fetchAffectedClasses(request);
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                View affected classes
              </button>
            )}

            {selectedRequest?.id === request.id && affectedClasses.length > 0 && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-900">Affected Classes</h4>
                <div className="mt-2 space-y-2">
                  {affectedClasses.map((cls) => (
                    <div key={cls.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{cls.type}</span>
                        <span className="text-gray-500 ml-2">
                          {new Date(cls.start_time).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {cls.members_count} members
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {requests.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">
            No requests found
          </div>
        )}

        {loading && (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 