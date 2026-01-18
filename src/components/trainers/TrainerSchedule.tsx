import React, { useState, useEffect } from "react";
import { Calendar, Views, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  FiPlus,
  FiFilter,
  FiEdit,
  FiTrash,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  trainer_id: string;
  type: "class" | "pt_session" | "leave" | "unavailable";
  status: "scheduled" | "completed" | "cancelled" | "no_show";
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
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [view, setView] = useState<View>(Views.WEEK);
  const handleViewChange = (nextView: View) => {
    setView(nextView);
  };
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        .from("trainers")
        .select("id, name, status")
        .order("name");

      if (error) throw error;
      setTrainers(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
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
          startDate = new Date(date);
          startDate.setDate(startDate.getDate() - startDate.getDay());
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          break;
        case Views.DAY:
          startDate = new Date(date);
          endDate = new Date(date);
          break;
        default:
          startDate = new Date(date);
          endDate = new Date(date);
      }

      let query = supabase
        .from("trainer_schedule")
        .select("*")
        .gte("start_time", startDate.toISOString())
        .lte("end_time", endDate.toISOString());

      if (selectedTrainer) {
        query = query.eq("trainer_id", selectedTrainer);
      }

      if (selectedType) {
        query = query.eq("type", selectedType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedEvents = data?.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        trainer_id: event.trainer_id,
        type: event.type,
        status: event.status,
        notes: event.notes,
        resourceId: event.resource_id,
      })) || [];

      setEvents(formattedEvents);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: Event) => {
  };

  const handleSelect = ({ start, end }: { start: Date; end: Date }) => {
  };

  const eventStyleGetter = (event: Event) => {
    const style: React.CSSProperties = {
      backgroundColor: "#3B82F6",
      borderRadius: "4px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
    };

    switch (event.type) {
      case "class":
        style.backgroundColor = "#10B981";
        break;
      case "pt_session":
        style.backgroundColor = "#8B5CF6";
        break;
      case "leave":
        style.backgroundColor = "#EF4444";
        break;
      case "unavailable":
        style.backgroundColor = "#6B7280";
        break;
    }

    switch (event.status) {
      case "completed":
        style.opacity = 0.6;
        break;
      case "cancelled":
        style.backgroundColor = "#F59E0B";
        break;
      case "no_show":
        style.backgroundColor = "#DC2626";
        break;
    }

    return { style };
  };

  const resources = trainers.map((trainer) => ({
    id: trainer.id,
    title: trainer.name,
    status: trainer.status,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trainer Schedule</h2>
          <p className="text-gray-600">Manage trainer schedules and availability</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
            <FiPlus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white rounded-2xl shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center space-x-2">
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        <select
          value={selectedTrainer}
          onChange={(e) => setSelectedTrainer(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="class">Class</option>
          <option value="pt_session">PT Session</option>
          <option value="leave">Leave</option>
          <option value="unavailable">Unavailable</option>
        </select>

        <select
          value={view}
          onChange={(e) => setView(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={Views.DAY}>Day</option>
          <option value={Views.WEEK}>Week</option>
          <option value={Views.MONTH}>Month</option>
        </select>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelect}
          selectable
          eventPropGetter={eventStyleGetter}
          resources={resources}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          tooltipAccessor={(event: Event) => `${event.title} - ${event.type}`}
          messages={{
            next: "Next",
            previous: "Previous",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            noEventsInRange: "No events in this range.",
          }}
        />
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-sm text-gray-700">Class</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-700">PT Session</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Leave</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-700">Unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
