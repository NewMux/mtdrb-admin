import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FiX, FiDownload, FiPrinter } from "react-icons/fi";
import { VatRate } from "../../types";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

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
  const { t } = useTranslation();
  const { isRTL } = useRTL();
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-start align-middle shadow-xl transition-all" dir={isRTL ? "rtl" : "ltr"}>
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                  >
                    {t("billing.generateVatReportModalTitle", "إنشاء تقرير ضريبة القيمة المضافة")}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("billing.startDate", "تاريخ البداية")}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("billing.endDate", "تاريخ النهاية")}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* VAT Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("billing.vatRate", "نسبة الضريبة")}
                    </label>
                    <select
                      value={vatRate}
                      onChange={(e) =>
                        setVatRate(Number(e.target.value) as VatRate)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value={0}>0% - معفى</option>
                      <option value={5}>5% - قياسي</option>
                      <option value={10}>10% - الفئة العامة (البحرين)</option>
                    </select>
                  </div>

                  {/* Report Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("billing.exportFormatTitle", "صيغة التقرير الإخراجية")}
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={handleGenerate}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
                      >
                        <FiDownload size={16} />
                        PDF
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
                      >
                        <FiDownload size={16} />
                        Excel
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
                      >
                        <FiPrinter size={16} />
                        {t("billing.print", "طباعة")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    {t("common.cancel", "إلغاء")}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    {t("billing.generateReport", "إنشاء التقرير")}
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
