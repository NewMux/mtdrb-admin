import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUpload,
  FiFile,
  FiCheck,
  FiAlertCircle,
  FiX,
  FiDownload,
} from "react-icons/fi";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fileData: any) => Promise<void>;
  loading?: boolean;
  modalRef?: React.RefObject<HTMLDivElement>;
}

interface ImportedMember {
  name: string;
  email: string;
  phone: string;
  status: string;
  membershipType: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  fitness_level?: string;
  goals?: string[];
  health_conditions?: string[];
  notes?: string;
}

const ImportMembersModal: React.FC<ImportMembersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  loading = false,
  modalRef,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [importedData, setImportedData] = React.useState<ImportedMember[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [previewMode, setPreviewMode] = React.useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      const data: ImportedMember[] = [];
      const newErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim());
          const row: any = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          // Validate required fields
          if (!row.name || !row.email) {
            newErrors.push(
              `Row ${i + 1}: Missing required fields (name or email)`,
            );
            continue;
          }

          // Validate email format
          if (!/\S+@\S+\.\S+/.test(row.email)) {
            newErrors.push(`Row ${i + 1}: Invalid email format`);
            continue;
          }

          data.push({
            name: row.name,
            email: row.email,
            phone: row.phone || "",
            status: row.status || "active",
            membershipType:
              row.membershiptype || row.membership_type || "Standard",
            gender: row.gender || "other",
            address: row.address || "",
            emergency_contact: row.emergency_contact || "",
            fitness_level: row.fitness_level || "beginner",
            goals: row.goals
              ? row.goals.split(";").map((g: string) => g.trim())
              : [],
            health_conditions: row.health_conditions
              ? row.health_conditions.split(";").map((h: string) => h.trim())
              : [],
            notes: row.notes || "",
          });
        }
      }

      setImportedData(data);
      setErrors(newErrors);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (importedData.length === 0) return;

    setIsUploading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate 5% chance of failure
      if (Math.random() < 0.05) {
        setErrors(["Import failed. Please try again."]);
        setIsUploading(false);
        return;
      }

      await onSuccess(importedData);
    } catch (error) {
      console.error("Import failed:", error);
      setErrors(["Import failed. Please try again."]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportedData([]);
    setErrors([]);
    setPreviewMode(false);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Email,Phone,Status,Membership Type,Gender,Address,Emergency Contact,Fitness Level,Goals,Health Conditions,Notes\n" +
      "John Doe,john.doe@email.com,+1 (555) 123-4567,active,Standard,male,123 Main St,City,State,+1 (555) 987-6543,beginner,weight_loss;strength,,Very motivated member\n" +
      "Jane Smith,jane.smith@email.com,+1 (555) 234-5678,active,Premium,female,456 Oak Ave,City,State,+1 (555) 876-5432,intermediate,muscle_gain,asthma,Prefers morning sessions";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "members_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ColorfulModalUI
          open={isOpen}
          onClose={handleClose}
          title="Import Members"
          subtitle="Upload a CSV file to import multiple members at once"
          modalRef={modalRef}
        >
          <div className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300border-gray-600 rounded-lg p-6 text-center">
                <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900text-white">
                    {file ? file.name : "Drop your CSV file here"}
                  </p>
                  <p className="text-sm text-gray-500text-gray-400">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700text-gray-300 bg-whitebg-gray-800 hover:bg-gray-50hover:bg-gray-700 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-blue-50bg-blue-900/20 border border-blue-200border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800text-blue-200">
                      Need a template?
                    </h4>
                    <p className="text-xs text-blue-600text-blue-300 mt-1">
                      Download our CSV template with example data
                    </p>
                  </div>
                  <SmartButton
                    variant="secondary"
                    size="sm"
                    icon={<FiDownload className="w-4 h-4" />}
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </SmartButton>
                </div>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50bg-red-900/20 border border-red-200border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiAlertCircle className="w-5 h-5 text-red-600text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800text-red-200 mb-2">
                      Import Errors ({errors.length})
                    </h4>
                    <ul className="space-y-1 text-xs text-red-700text-red-300">
                      {errors.map((error, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {importedData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900text-white">
                    Preview ({importedData.length} members)
                  </h3>
                  <SmartButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? "Hide Details" : "Show Details"}
                  </SmartButton>
                </div>

                {previewMode && (
                  <div className="max-h-64 overflow-y-auto border border-gray-200border-gray-700 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700text-gray-300">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-gray-700text-gray-300">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-gray-700text-gray-300">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-gray-700text-gray-300">
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200divide-gray-700">
                        {importedData.slice(0, 10).map((member, index) => (
                          <tr key={index} className="bg-whitebg-gray-900">
                            <td className="px-4 py-2 text-gray-900text-white">
                              {member.name}
                            </td>
                            <td className="px-4 py-2 text-gray-600text-gray-400">
                              {member.email}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  member.status === "active"
                                    ? "bg-emerald-100 text-emerald-800bg-emerald-900text-emerald-200"
                                    : "bg-gray-100 text-gray-800bg-gray-900text-gray-200"
                                }`}
                              >
                                {member.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600text-gray-400">
                              {member.membershipType}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importedData.length > 10 && (
                      <div className="px-4 py-2 text-xs text-gray-500text-gray-400 text-center">
                        Showing first 10 of {importedData.length} members
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-green-50bg-green-900/20 border border-green-200border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FiCheck className="w-5 h-5 text-green-600text-green-400" />
                    <span className="text-sm font-medium text-green-800text-green-200">
                      {importedData.length} members ready to import
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200border-gray-700">
              <SmartButton
                variant="secondary"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </SmartButton>

              <SmartButton
                onClick={handleImport}
                loading={isUploading}
                disabled={
                  importedData.length === 0 || errors.length > 0 || isUploading
                }
                icon={<FiUpload className="w-4 h-4" />}
              >
                {isUploading
                  ? "Importing..."
                  : `Import ${importedData.length} Members`}
              </SmartButton>
            </div>
          </div>
        </ColorfulModalUI>
      )}
    </AnimatePresence>
  );
};

export default ImportMembersModal;
