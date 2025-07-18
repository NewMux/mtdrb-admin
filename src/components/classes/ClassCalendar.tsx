import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop(Calendar);

interface ClassEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Class;
}

interface Class {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface Props {
  onAdd: (initialValues: { startTime: string, endTime: string }) => void;
  onEdit: (classItem: Class) => void;
  classes: Class[];
  date: Date;
  view: string;
  onView: (view: string) => void;
  onNavigate: (date: Date) => void;
}

export default function ClassCalendar({ onAdd, onEdit, classes, date, view, onView, onNavigate }: Props) {

  const events: ClassEvent[] = useMemo(() => {
    return classes.map(c => ({
      id: c.id,
      title: c.name,
      start: new Date(c.startTime),
      end: new Date(c.endTime),
      resource: c,
    }));
  }, [classes]);

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    onAdd({ startTime: start.toISOString(), endTime: end.toISOString() });
  };

  const handleSelectEvent = (event: ClassEvent) => {
    onEdit(event.resource);
  };

  return (
    <div className="w-full h-[700px]">
      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        onSelectEvent={handleSelectEvent}
        selectable
        onSelectSlot={handleSelectSlot}
        // Disabling drag and drop for now until backend logic is confirmed
        draggableAccessor={() => false}
        date={date}
        view={view}
        onView={onView}
        onNavigate={onNavigate}
        toolbar={false}
      />
    </div>
  );
} 