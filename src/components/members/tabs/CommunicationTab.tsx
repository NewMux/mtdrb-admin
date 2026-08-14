import React from "react";

interface CommunicationTabProps {
  log: unknown[];
  staffNotes: string;
  onStaffNotesChange: (notes: string) => void;
  futureMessages: unknown[];
}

const CommunicationTab: React.FC<CommunicationTabProps> = () => {
  return <div className="p-6">{/* TODO: Log, notes, future messages */}</div>;
};

export default CommunicationTab;
