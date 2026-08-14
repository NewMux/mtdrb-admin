import React, { useState } from "react";
import {
  FiX,
  FiFileText,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiShield,
} from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerSummary {
  name: string;
  email: string;
}

interface TrainerNotesModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: TrainerSummary;
}

const TrainerNotesModal: React.FC<TrainerNotesModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const [notes, setNotes] = useState("");
  const [noteType, setNoteType] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mockNotes = [
    {
      id: 1,
      content:
        "Excellent performance in morning classes. Members consistently rate 4.8+ stars.",
      type: "performance",
      isPrivate: false,
      createdAt: "2024-01-20T10:00:00Z",
      createdBy: "Admin",
    },
    {
      id: 2,
      content:
        "Requested additional training on advanced yoga techniques. Scheduled for next week.",
      type: "training",
      isPrivate: true,
      createdAt: "2024-01-19T14:30:00Z",
      createdBy: "Manager",
    },
    {
      id: 3,
      content:
        "Great communication with members. Often receives positive feedback.",
      type: "feedback",
      isPrivate: false,
      createdAt: "2024-01-18T09:15:00Z",
      createdBy: "Admin",
    },
  ];

  const handleAddNote = async () => {
    if (!notes.trim() || !noteType) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setNotes("");
    setNoteType("");
    setIsPrivate(false);
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FiFileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trainer Notes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage notes and observations about trainer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Trainer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Trainer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium">
                  {trainer?.name || "John Doe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium">
                  {trainer?.email || "john@fit.com"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Add New Note */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Add New Note
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note Type
                </label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select note type</option>
                  <option value="performance">Performance</option>
                  <option value="training">Training</option>
                  <option value="feedback">Feedback</option>
                  <option value="incident">Incident</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note Content
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your note here..."
                />
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isPrivate"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Private note (only visible to managers)
                </label>
              </div>
              <button
                onClick={handleAddNote}
                disabled={!notes.trim() || !noteType || isLoading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiPlus className="w-4 h-4" />
                )}
                <span>Add Note</span>
              </button>
            </div>
          </div>

          {/* Smart Recommendation for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    Smart Suggestion
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Consider adding a note about the recent improvement in class
                    attendance and member satisfaction scores.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Existing Notes */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Existing Notes
            </h3>
            <div className="space-y-3">
              {mockNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {note.type}
                        </span>
                        {note.isPrivate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-white mb-2">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>By {note.createdBy}</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <FiEdit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <FiTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
              Export Notes
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerNotesModal;
