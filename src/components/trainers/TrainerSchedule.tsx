import React, { useState, useEffect } from 'react';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  FiPlus,
  FiCalendar,
  FiFilter,
  FiEdit,
  FiTrash,
  FiClock,
  FiMapPin
} from 'react-icons/fi';
import { supabase } from '../../supabaseClient';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  trainer_id: string;
  type: 'class' | 'pt_session' | 'leave' | 'unavailable';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  resourceId?: string;
}

interface Trainer {
  id: string;
  name: string;
  status: string;
}

interface Resource {
  id: string;
  title: string;
  status: string;
}

export default function TrainerSchedule() {
  const [events, setEvents] = useState<Event[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (trainers.length > 0) {
      fetchEvents();
    }
  }, [trainers, selectedTrainer, selectedType, view, date]);

  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('id, name, status')
        .order('name');

      if (error) throw error;
      setTrainers(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on view
      let startDate, endDate;
      switch (view) {
        case Views.MONTH:
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          break;
        case Views.WEEK:
          startDate = startOfWeek(date);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
          break;
        default:
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
      }

      let query = supabase
        .from('trainer_schedule')
        .select(`
          *,
          trainer:trainers (
            name
          )
        `)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (selectedTrainer) {
        query = query.eq('trainer_id', selectedTrainer);
      }

      if (selectedType) {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedEvents = (data || []).map((event: any) => ({
        id: event.id,
        title: `${event.trainer.name} - ${event.type.replace('_', ' ').toUpperCase()}`,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        trainer_id: event.trainer_id,
        type: event.type,
        status: event.status,
        notes: event.notes,
        resourceId: event.trainer_id
      }));

      setEvents(formattedEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleSelect = ({ start, end }: { start: Date; end: Date }) => {
    setShowAddModal(true);
  };

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = '#3182ce'; // default blue

    switch (event.type) {
      case 'class':
        backgroundColor = '#2C5282'; // blue
        break;
      case 'pt_session':
        backgroundColor = '#2F855A'; // green
        break;
      case 'leave':
        backgroundColor = '#C53030'; // red
        break;
      case 'unavailable':
        backgroundColor = '#718096'; // gray
        break;
    }

    if (event.status === 'cancelled') {
      backgroundColor = '#718096'; // gray
    } else if (event.status === 'no_show') {
      backgroundColor = '#C53030'; // red
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  const resources: Resource[] = trainers.map(trainer => ({
    id: trainer.id,
    title: trainer.name,
    status: trainer.status
  }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2">
          <select
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Trainers</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="class">Class</option>
            <option value="pt_session">Personal Training</option>
            <option value="leave">Leave</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Add Session
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 300px)' }}
          views={['month', 'week', 'day']}
          step={30}
          defaultView={Views.WEEK}
          selectable
          onSelectSlot={handleSelect}
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          resources={resources}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          onView={setView as any}
          onNavigate={setDate}
          tooltipAccessor={(event: Event) => `
            ${event.title}
            Status: ${event.status}
            ${event.notes ? `Notes: ${event.notes}` : ''}
          `}
        />
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-700 mr-2"></div>
            <span className="text-sm text-gray-600">Class</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-700 mr-2"></div>
            <span className="text-sm text-gray-600">Personal Training</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-700 mr-2"></div>
            <span className="text-sm text-gray-600">Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-gray-500 mr-2"></div>
            <span className="text-sm text-gray-600">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal would go here */}
      {/* TODO: Implement AddSessionModal and EditSessionModal components */}
    </div>
  );
} 