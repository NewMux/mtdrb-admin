import React from "react";

interface ProgressGoalsTabProps {
  goal: string;
  progress: any;
  trainerNotes: string;
  onNotesChange: (notes: string) => void;
  upgradeSuggestion: string;
}

const ProgressGoalsTab: React.FC<ProgressGoalsTabProps> = () => {
  return (
    <div className="p-6">{/* TODO: Progress chart, notes, suggestion */}</div>
  );
};

export default ProgressGoalsTab;
