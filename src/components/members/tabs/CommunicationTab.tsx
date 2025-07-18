import React from 'react';

interface CommunicationTabProps {
  log: any[];
  staffNotes: string;
  onStaffNotesChange: (notes: string) => void;
  futureMessages: any[];
}

const CommunicationTab: React.FC<CommunicationTabProps> = ({ log, staffNotes, onStaffNotesChange, futureMessages }) => {
  return (
    <div className="p-6">{/* TODO: Log, notes, future messages */}</div>
  );
};

export default CommunicationTab; 