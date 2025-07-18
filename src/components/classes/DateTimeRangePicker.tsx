import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiX } from 'react-icons/fi';
import { SmartButton } from '../ui/DesignSystem';
import './DateTimeRangePicker.css';

interface DateTimeRangePickerProps {
  startTime: Date | null;
  endTime: Date | null;
  onChange?: (dateRange: [Date | null, Date | null]) => void;
  className?: string;
}

const DateTimeRangePicker: React.FC<DateTimeRangePickerProps> = ({
  startTime,
  endTime,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState<Date | null>(startTime);
  const [tempEndTime, setTempEndTime] = useState<Date | null>(endTime);

  const handleSave = () => {
    if (onChange) {
      onChange([tempStartTime, tempEndTime]);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartTime(startTime);
    setTempEndTime(endTime);
    setIsOpen(false);
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Select date & time';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`datetime-range-picker ${className}`}>
      <div className="picker-trigger" onClick={() => setIsOpen(true)}>
        <div className="datetime-display">
          <div className="start-time">
            <FiCalendar className="icon" />
            <span>Start: {formatDateTime(startTime)}</span>
          </div>
          <div className="end-time">
            <FiClock className="icon" />
            <span>End: {formatDateTime(endTime)}</span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="picker-overlay">
          <div className="picker-modal">
            <div className="picker-header">
              <h3>Select Date & Time Range</h3>
            </div>
            
            <div className="picker-content">
              <div className="time-inputs">
                <div className="input-group">
                  <label>Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={tempStartTime ? tempStartTime.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setTempStartTime(e.target.value ? new Date(e.target.value) : null)}
                    className="datetime-input"
                  />
                </div>
                
                <div className="input-group">
                  <label>End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={tempEndTime ? tempEndTime.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setTempEndTime(e.target.value ? new Date(e.target.value) : null)}
                    className="datetime-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <SmartButton variant="secondary" size="sm" onClick={handleCancel}>
                Cancel
              </SmartButton>
              <SmartButton variant="primary" size="sm" onClick={handleSave}>
                Save
              </SmartButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimeRangePicker; 