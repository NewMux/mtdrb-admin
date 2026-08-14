import React from "react";

interface DocumentsTabProps {
  documents: unknown[];
  onResend: (docId: string) => void;
  onReupload: (docId: string) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = () => {
  return (
    <div className="p-6">
      {/* TODO: Document list, status badges, actions */}
    </div>
  );
};

export default DocumentsTab;
