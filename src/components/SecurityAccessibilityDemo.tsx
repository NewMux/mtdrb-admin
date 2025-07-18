import React, { useState } from 'react';
import { useRateLimit } from '../hooks/useRateLimit';
import { validateDateRange, validateDateInput } from '../utils/dateValidation';
import { sanitizeInput, validateEmail, validatePhoneNumber } from '../utils/sanitizeInput';
import { exportJSON, exportCSV, exportPDF } from '../utils/exportData';
import { AccessibleModal } from './AccessibleModal';
import TabsNav from './ui/TabsNav';
import { ChartSkeleton, TableSkeleton } from './ChartSkeleton';
import { ErrorBoundary } from './ErrorBoundary';

const SecurityAccessibilityDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sanitizedValue, setSanitizedValue] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [validationResult, setValidationResult] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Rate limiting for AI queries
  const rateLimit = useRateLimit(5, 60000); // 5 requests per minute

  const handleAICall = () => {
    try {
      rateLimit.checkLimit();
      setValidationResult(`AI call successful! Remaining requests: ${rateLimit.remainingRequests}`);
    } catch (error) {
      setValidationResult(`Rate limit exceeded: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSanitizeInput = () => {
    const sanitized = sanitizeInput(inputValue);
    setSanitizedValue(sanitized);
  };

  const handleValidateDates = () => {
    try {
      const start = validateDateInput(dateStart);
      const end = validateDateInput(dateEnd);
      const result = validateDateRange(start, end);
      setValidationResult(`Valid date range: ${result.start} to ${result.end}`);
    } catch (error) {
      setValidationResult(`Date validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'pdf') => {
    const testData = [
      { id: 1, name: 'John Doe', revenue: 1500 },
      { id: 2, name: 'Jane Smith', revenue: 2200 },
      { id: 3, name: 'Bob Johnson', revenue: 1800 }
    ];

    try {
      switch (format) {
        case 'json':
          exportJSON(testData, 'test-data');
          break;
        case 'csv':
          exportCSV(testData, 'test-data');
          break;
        case 'pdf':
          exportPDF(testData, 'test-data', 'Test Report');
          break;
      }
      setValidationResult(`${format.toUpperCase()} export successful!`);
    } catch (error) {
      setValidationResult(`Export error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'security', label: 'Security' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'export', label: 'Export' }
  ];

  const testErrorComponent = () => {
    throw new Error('This is a test error for the error boundary');
  };

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Security & Accessibility Features Demo
        </h1>

        {/* Tabs Navigation with URL Deep Linking */}
        <TabsNav
          tabs={tabs.map(tab => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-6"
        />

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Overview</h2>
              
              {/* Rate Limiting Demo */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Rate Limiting Demo</h3>
                <div className="flex space-x-4 items-center">
                  <button
                    onClick={handleAICall}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Make AI Call
                  </button>
                  <span className="text-sm text-gray-600">
                    Remaining: {rateLimit.remainingRequests} | 
                    Reset in: {Math.ceil(rateLimit.timeUntilReset / 1000)}s
                  </span>
                </div>
              </div>

              {/* Loading Skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Chart Skeleton</h3>
                  <ChartSkeleton />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Table Skeleton</h3>
                  <TableSkeleton rows={3} columns={3} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Security Features</h2>
              
              {/* Input Sanitization */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Input Sanitization (XSS Protection)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Input (try XSS):</label>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Try: <script>alert('xss')</script>"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <button
                    onClick={handleSanitizeInput}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Sanitize Input
                  </button>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sanitized Result:</label>
                    <div className="p-2 bg-gray-100 rounded min-h-[2rem]">
                      {sanitizedValue || 'No input sanitized yet'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Validation */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Date Validation & Timezone</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date:</label>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date:</label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <button
                  onClick={handleValidateDates}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Validate Date Range
                </button>
              </div>

              {/* Email & Phone Validation */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Email & Phone Validation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="w-full p-2 border rounded"
                    />
                    <div className="text-sm mt-1">
                      Valid: {validateEmail(email) ? '✅' : '❌'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone:</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full p-2 border rounded"
                    />
                    <div className="text-sm mt-1">
                      Valid: {validatePhoneNumber(phone) ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Accessibility Features</h2>
              
              {/* Accessible Modal Demo */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Accessible Modal</h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Open Accessible Modal
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Try navigating with Tab key and closing with Escape
                </p>
              </div>

              {/* Error Boundary Demo */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Error Boundary</h3>
                <button
                  onClick={testErrorComponent}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Trigger Test Error
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  This will trigger the error boundary to catch and display the error
                </p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Multi-Format Export</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleExportData('json')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExportData('csv')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportData('pdf')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Export PDF
                </button>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">Results:</h3>
              <p className="text-sm">{validationResult}</p>
            </div>
          )}
        </div>

        {/* Accessible Modal */}
        {showModal && (
          <AccessibleModal
            onClose={() => setShowModal(false)}
            title="Accessible Modal Demo"
            description="This modal demonstrates keyboard navigation and screen reader compatibility."
          >
            <div className="space-y-4">
              <p>This modal is fully accessible with:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Keyboard navigation (Tab, Shift+Tab, Escape)</li>
                <li>Screen reader compatibility</li>
                <li>Focus management</li>
                <li>ARIA attributes</li>
              </ul>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Close Modal
                </button>
                <button
                  onClick={() => alert('Action performed!')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Perform Action
                </button>
              </div>
            </div>
          </AccessibleModal>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default SecurityAccessibilityDemo; 