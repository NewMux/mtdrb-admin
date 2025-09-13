import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FiX, FiDownload, FiPrinter } from "react-icons/fi";
import { VatRate } from "../../types";

interface VatReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

const VatReportModal: React.FC<VatReportModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [vatRate, setVatRate] = useState<VatRate>(10);

  const handleGenerate = () => {
    // TODO: Implement report generation
    onGenerate();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Generate VAT Report
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* VAT Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      VAT Rate
                    </label>
                    <select
                      value={vatRate}
                      onChange={(e) =>
                        setVatRate(Number(e.target.value) as VatRate)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                    </select>
                  </div>

                  {/* Report Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Format
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={handleGenerate}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FiDownload size={18} />
                        PDF
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FiDownload size={18} />
                        Excel
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <FiPrinter size={18} />
                        Print
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Generate Report
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default VatReportModal;
