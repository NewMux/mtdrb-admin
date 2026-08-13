import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { 
  EventClickArg, 
  EventDropArg
} from '@fullcalendar/core';
import type { 
  DateClickArg, 
  EventResizeDoneArg
} from '@fullcalendar/interaction';
import { 
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import { AddClassModal, EditClassModal } from './modals';
import './FullCalendar.css';
import { useTranslation } from 'react-i18next';

// Type definitions
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  trainer: string;
  type: string;
  capacity: number;
  enrolled: number;
  className?: string;
  branch: string;
  room?: string;
  description?: string;
}

interface CalendarFilters {
  classType: string[];
  trainer: string[];
  branch: string[];
  timeOfDay: string[];
  search: string;
}

const emptyClasses: CalendarEvent[] = [];

const ClassCalendar: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>(emptyClasses);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'timeGridWeek' | 'timeGridDay' | 'dayGridMonth'>('timeGridWeek');
  const [filters, setFilters] = useState<CalendarFilters>({
    classType: [],
    trainer: [],
    branch: [],
    timeOfDay: [],
    search: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !event.trainer.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Class type filter
      if (filters.classType.length > 0 && !filters.classType.includes(event.type.toLowerCase())) {
        return false;
      }

      // Trainer filter - match by lowercase
      if (filters.trainer.length > 0 && !filters.trainer.includes(event.trainer.toLowerCase())) {
        return false;
      }

      // Branch filter
      if (filters.branch.length > 0 && !filters.branch.includes(event.branch)) {
        return false;
      }

      // Time of day filter
      if (filters.timeOfDay.length > 0) {
        const hour = new Date(event.start).getHours();
        const timeOfDay = hour < 12 ? t('classes.morning') : hour < 17 ? t('classes.afternoon') : t('classes.evening');
        if (!filters.timeOfDay.includes(timeOfDay)) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters, t]);

  // Event handlers
  const handleEventClick = useCallback((info: EventClickArg) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsEditModalOpen(true);
    }
  }, [events]);

  const handleDateClick = useCallback((info: DateClickArg) => {
    void info;
    setIsCreateModalOpen(true);
  }, []);

  const handleEventDrop = useCallback((info: EventDropArg) => {
    const { event } = info;
    const updatedEvents = events.map(e => 
      e.id === event.id 
        ? { ...e, start: event.startStr, end: event.endStr }
        : e
    );
    setEvents(updatedEvents);
    toast.success(t('classes.classRescheduledSuccessfully'));
  }, [events, t]);

  const handleEventResize = useCallback((info: EventResizeDoneArg) => {
    const { event } = info;
    const updatedEvents = events.map(e => 
      e.id === event.id 
        ? { ...e, start: event.startStr, end: event.endStr }
        : e
    );
    setEvents(updatedEvents);
    toast.success(t('classes.classDurationUpdated'));
  }, [events, t]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load events from Supabase
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: membership } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (!membership?.tenant_id) {
          setIsLoading(false);
          return;
        }

        const { data: classes, error } = await supabase
          .from("classes")
          .select("*")
          .eq("tenant_id", membership.tenant_id)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Error loading classes:", error);
          setIsLoading(false);
          return;
        }

        if (classes) {
          const calendarEvents: CalendarEvent[] = classes.map((cls) => ({
            id: cls.id,
            title: cls.name,
            start: cls.start_time,
            end: cls.end_time,
            trainer: cls.trainer_id || t('classes.notAssigned'),
            type: cls.metadata?.type as string || "class",
            capacity: cls.capacity,
            enrolled: cls.current_bookings || 0,
            branch: membership.tenant_id,
            room: cls.room,
            description: cls.description,
          }));

          setEvents(calendarEvents);
        }
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <>
      <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
        {/* Google Calendar Style Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation and View Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => calendarRef.current?.getApi().prev()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => calendarRef.current?.getApi().today()}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  {t('classes.today')}
                </button>
                <button
                  onClick={() => calendarRef.current?.getApi().next()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Right side - View Toggle and Create Button */}
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => {
                    setView('timeGridDay');
                    calendarRef.current?.getApi().changeView('timeGridDay');
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === 'timeGridDay' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('classes.day')}
                </button>
                <button
                  onClick={() => {
                    setView('timeGridWeek');
                    calendarRef.current?.getApi().changeView('timeGridWeek');
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === 'timeGridWeek' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('classes.week')}
                </button>
                <button
                  onClick={() => {
                    setView('dayGridMonth');
                    calendarRef.current?.getApi().changeView('dayGridMonth');
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === 'dayGridMonth' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('classes.month')}
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <select
                value={filters.classType.join(',')}
                onChange={(e) => setFilters((prev: CalendarFilters) => ({ 
                  ...prev, 
                  classType: e.target.value ? e.target.value.split(',') : [] 
                }))}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('classes.allTypes')}</option>
                <option value="hiit">{t('classes.hiit')}</option>
                <option value="yoga">{t('classes.yoga')}</option>
                <option value="pilates">{t('classes.pilates')}</option>
                <option value="strength">{t('classes.strength')}</option>
                <option value="cardio">{t('classes.cardio')}</option>
                <option value="spinning">{t('classes.spinning')}</option>
              </select>
              
              <select
                value={filters.trainer.join(',')}
                onChange={(e) => setFilters((prev: CalendarFilters) => ({ 
                  ...prev, 
                  trainer: e.target.value ? e.target.value.split(',') : [] 
                }))}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('classes.allTrainers')}</option>
                <option value="ahmed">Ahmed</option>
                <option value="lina">Lina</option>
                <option value="mike">Mike</option>
                <option value="sarah">Sarah</option>
              </select>
              
              <input
                type="text"
                placeholder={t('classes.searchClasses')}
                value={filters.search}
                onChange={(e) => setFilters((prev: CalendarFilters) => ({ ...prev, search: e.target.value }))}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center">
              <FiCalendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('classes.noClassesScheduled')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('classes.clickOnTimeSlot')}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
              >
                {t('classes.addYourFirstClass')}
              </button>
            </div>
                    ) : (
            <div className="h-full w-full">
              <div className="h-full">
                <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={view}
              editable={true}
              selectable={true}
              events={filteredEvents}
              headerToolbar={false}
              height="100%"
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
              eventDisplay="block"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              eventClassNames="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              dayCellClassNames="hover:bg-gray-50 transition-colors"
              nowIndicator={false}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                startTime: '06:00',
                endTime: '22:00',
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              slotLabelClassNames="text-gray-600 font-medium"
              dayHeaderClassNames="text-gray-900 font-semibold"
              titleFormat={{
                month: 'long',
                year: 'numeric',
              }}
              buttonText={{
                today: t('classes.today'),
                week: t('classes.week'),
                day: t('classes.day'),
              }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AddClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Reload events
          const loadEvents = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: membership } = await supabase
              .from("memberships")
              .select("tenant_id")
              .eq("user_id", user.id)
              .single();

            if (!membership?.tenant_id) return;

            const { data: classes } = await supabase
              .from("classes")
              .select("*")
              .eq("tenant_id", membership.tenant_id)
              .gte("start_time", new Date().toISOString())
              .order("start_time", { ascending: true });

            if (classes) {
              const calendarEvents: CalendarEvent[] = classes.map((cls) => ({
                id: cls.id,
                title: cls.name,
                start: cls.start_time,
                end: cls.end_time,
                trainer: cls.trainer_id || t('classes.notAssigned'),
                type: cls.metadata?.type as string || "class",
                capacity: cls.capacity,
                enrolled: cls.current_bookings || 0,
                branch: membership.tenant_id,
                room: cls.room,
                description: cls.description,
              }));
              setEvents(calendarEvents);
            }
          };
          loadEvents();
        }}
      />

      {selectedEvent && (
      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
          classId={selectedEvent.id}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedEvent(null);
            // Reload events
            const loadEvents = async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { data: membership } = await supabase
                .from("memberships")
                .select("tenant_id")
                .eq("user_id", user.id)
                .single();

              if (!membership?.tenant_id) return;

              const { data: classes } = await supabase
                .from("classes")
                .select("*")
                .eq("tenant_id", membership.tenant_id)
                .gte("start_time", new Date().toISOString())
                .order("start_time", { ascending: true });

              if (classes) {
                const calendarEvents: CalendarEvent[] = classes.map((cls) => ({
                  id: cls.id,
                  title: cls.name,
                  start: cls.start_time,
                  end: cls.end_time,
                  trainer: cls.trainer_id || t('classes.notAssigned'),
                  type: cls.metadata?.type as string || "class",
                  capacity: cls.capacity,
                  enrolled: cls.current_bookings || 0,
                  branch: membership.tenant_id,
                  room: cls.room,
                  description: cls.description,
                }));
                setEvents(calendarEvents);
              }
            };
            loadEvents();
          }}
        />
      )}
    </>
  );
};

export default ClassCalendar;
