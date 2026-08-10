import React, { useRef, useState, useCallback } from "react";
import {
  FiUploadCloud,
  FiFileText,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import Papa, { type ParseResult } from "papaparse";
import { supabase } from "../../supabaseClient";

const REQUIRED_COLUMNS = ["name", "status"];

interface MemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
}

interface DuplicateWarning {
  rowIndex: number;
  fields: {
    field: string;
    value: string;
    matchingRows: number[];
  }[];
}

interface CsvData {
  [key: string]: string | number | boolean | null;
}

export default function MemberImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: MemberImportModalProps) {
  const [, setFile] = useState<File | null>(null);
  const [, setDragActive] = useState(false);
  const [csvData, setCsvData] = useState<CsvData[]>([]);
  const [, setCsvHeaders] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [duplicateWarnings, setDuplicateWarnings] = useState<
    DuplicateWarning[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to check for duplicates in the CSV data
  const checkDuplicates = useCallback((data: CsvData[]) => {
    const warnings: DuplicateWarning[] = [];
    const fieldsToCheck = ["name", "email", "phone"];

    // Create indexes for each field
    const indexes: { [key: string]: { [value: string]: number[] } } = {};
    fieldsToCheck.forEach((field) => {
      indexes[field] = {};
    });

    // Build indexes
    data.forEach((row, rowIndex) => {
      fieldsToCheck.forEach((field) => {
        const value = (row[field] || "").toString().trim().toLowerCase();
        if (value) {
          if (!indexes[field][value]) {
            indexes[field][value] = [];
          }
          indexes[field][value].push(rowIndex);
        }
      });
    });

    // Check each row for duplicates
    data.forEach((_row, rowIndex) => {
      const rowWarnings: {
        field: string;
        value: string;
        matchingRows: number[];
      }[] = [];

      fieldsToCheck.forEach((field) => {
        const value = (data[rowIndex][field] || "")
          .toString()
          .trim()
          .toLowerCase();
        if (value && indexes[field][value].length > 1) {
          const matchingRows = indexes[field][value].filter(
            (i) => i !== rowIndex,
          );
          if (matchingRows.length > 0) {
            rowWarnings.push({
              field,
              value: data[rowIndex][field] as string,
              matchingRows,
            });
          }
        }
      });

      if (rowWarnings.length > 0) {
        warnings.push({
          rowIndex,
          fields: rowWarnings,
        });
      }
    });

    return warnings;
  }, []);

  // Check for duplicates in existing members
  const checkExistingDuplicates = useCallback(async (data: CsvData[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: membershipData } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!membershipData?.tenant_id) throw new Error("No organization found");

      const warnings: DuplicateWarning[] = [];
      const fieldsToCheck = ["name", "email", "phone"];

      // Check each row against existing members
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        const rowWarnings: {
          field: string;
          value: string;
          matchingRows: number[];
        }[] = [];

        for (const field of fieldsToCheck) {
          const value = String(row[field] || "").trim();
          if (value) {
            const { data: existingMembers } = await supabase
              .from("members")
              .select(field)
              .eq("tenant_id", membershipData.tenant_id)
              .ilike(field, value);

            if (existingMembers && existingMembers.length > 0) {
              rowWarnings.push({
                field,
                value,
                matchingRows: [-1], // Use -1 to indicate existing database record
              });
            }
          }
        }

        if (rowWarnings.length > 0) {
          warnings.push({
            rowIndex,
            fields: rowWarnings,
          });
        }
      }

      return warnings;
    } catch (error) {
      console.error("Error checking existing duplicates:", error);
      return [];
    }
  }, []);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCsv(e.target.files[0]);
    }
  };

  // Handle drag events
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseCsv(e.dataTransfer.files[0]);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csv = "#,name,email,phone,status\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCsv = async (file: File) => {
    setFile(file);
    setCsvError(null);
    setImportResult(null);
    setDuplicateWarnings([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<CsvData>) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        const data = results.data as CsvData[];
        setCsvData(data);

        // Check for missing required columns
        const missing = REQUIRED_COLUMNS.filter(
          (col) => !headers.includes(col),
        );
        if (missing.length > 0) {
          setCsvError(`Missing required columns: ${missing.join(", ")}`);
          return;
        }

        // Check for duplicates within the CSV
        const internalDuplicates = checkDuplicates(data);

        // Check for duplicates with existing members
        const existingDuplicates = await checkExistingDuplicates(data);

        setDuplicateWarnings([...internalDuplicates, ...existingDuplicates]);
      },
      error: (err: Error) => {
        setCsvError("Failed to parse CSV: " + err.message);
        setCsvHeaders([]);
        setCsvData([]);
        setDuplicateWarnings([]);
      },
    });
  };

  // Import to Supabase
  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No user found");
      }

      // Get tenant_id from memberships table
      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (membershipError) {
        throw new Error("Failed to get organization details");
      }

      if (!membershipData?.tenant_id) {
        throw new Error("No organization found");
      }

      const membersToInsert = csvData.map((row) => ({
        tenant_id: membershipData.tenant_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        status: row.status,
      }));

      const { error: insertError } = await supabase
        .from("members")
        .insert(membersToInsert);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setImportResult({
        success: true,
        message: `${csvData.length} members imported successfully.`,
      });
      onImportSuccess();
    } catch (error) {
      setImportResult({
        success: false,
        message: "Import failed: " + (error as Error).message,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleModalClose = () => {
    setCsvData([]);
    setCsvError(null);
    setImportResult(null);
    setDuplicateWarnings([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-auto flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Import Members
          </h2>
          <button
            onClick={handleModalClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out min-h-[44px]"
          >
            <FiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto">
          {csvData.length === 0 ? (
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors 
              ${"border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
            >
              <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Drag & drop a CSV file here, or{" "}
                <button
                  type="button"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  onClick={() => inputRef.current?.click()}
                >
                  browse your files
                </button>
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Required columns: {REQUIRED_COLUMNS.join(", ")}
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <FiFileText />
                Download CSV Template
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiFileText className="text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {csvData.length} rows detected
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCsvData([]);
                    setCsvError(null);
                    setImportResult(null);
                  }}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear and start over
                </button>
              </div>

              {/* Warnings */}
              {duplicateWarnings.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="text-yellow-500 dark:text-yellow-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        {duplicateWarnings.length} Potential Duplicate(s) Found
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Review the warnings below. You can still import, but it
                        may create duplicate members.
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                    {duplicateWarnings.slice(0, 5).map((warning, i) => (
                      <li key={i}>
                        Row {warning.rowIndex + 2}: Duplicate{" "}
                        {warning.fields
                          .map((f) => `${f.field} "${f.value}"`)
                          .join(", ")}
                      </li>
                    ))}
                    {duplicateWarnings.length > 5 && (
                      <li>...and {duplicateWarnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Table Preview */}
              <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      {Object.keys(csvData[0]).map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {csvData.slice(0, 10).map((row, i) => (
                      <tr
                        key={i}
                        className={
                          duplicateWarnings.some((w) => w.rowIndex === i)
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : ""
                        }
                      >
                        {Object.values(row).map((value, j) => (
                          <td
                            key={j}
                            className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                          >
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 10 && (
                  <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                    ...and {csvData.length - 10} more rows
                  </p>
                )}
              </div>
            </div>
          )}

          {csvError && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-3">
              <FiAlertCircle className="mt-1" />
              <div>
                <h3 className="font-semibold">Import Error</h3>
                <p>{csvError}</p>
              </div>
            </div>
          )}

          {importResult && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                importResult.success
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              }`}
            >
              {importResult.success ? (
                <FiCheckCircle className="mt-1" />
              ) : (
                <FiAlertCircle className="mt-1" />
              )}
              <div>
                <h3 className="font-semibold">
                  {importResult.success ? "Import Successful" : "Import Failed"}
                </h3>
                <p>{importResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {csvData.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ready to import {csvData.length} members?
            </p>
            <button
              onClick={handleImport}
              disabled={importing || !!csvError}
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg shadow-md
                         hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {importing ? "Importing..." : "Confirm and Import"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
