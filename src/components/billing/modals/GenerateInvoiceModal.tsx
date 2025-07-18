import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiFileText, FiUser, FiCalendar, FiDollarSign, FiShield, FiZap } from "react-icons/fi";
import { SmartBillingModal } from "./SmartBillingModal";
import { useSmartBillingModal } from "./useSmartBillingModal";

interface GenerateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  memberId?: string;
  planId?: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  category: 'pt' | 'subscription' | 'product' | 'custom';
}

const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  open,
  onClose,
  memberId,
  planId
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMember, setSelectedMember] = useState(memberId || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    data,
    loading,
    validation,
    suggestions,
    isProUser,
    updateData,
    getSmartDefaults,
    fetchRelatedData
  } = useSmartBillingModal({ memberId, planId });

  const invoiceTemplates: InvoiceTemplate[] = [
    {
      id: 'pt-session',
      name: 'Personal Training Session',
      description: 'Standard 1-hour personal training session',
      category: 'pt',
      items: [
        { description: 'Personal Training Session (1 hour)', quantity: 1, unitPrice: 150 }
      ]
    },
    {
      id: 'pt-package',
      name: 'PT Package (10 Sessions)',
      description: 'Package of 10 personal training sessions',
      category: 'pt',
      items: [
        { description: 'Personal Training Package (10 sessions)', quantity: 1, unitPrice: 1200 }
      ]
    },
    {
      id: 'monthly-subscription',
      name: 'Monthly Gym Membership',
      description: 'Standard monthly gym membership',
      category: 'subscription',
      items: [
        { description: 'Monthly Gym Membership', quantity: 1, unitPrice: 299 }
      ]
    },
    {
      id: 'premium-subscription',
      name: 'Premium Membership',
      description: 'Premium membership with all amenities',
      category: 'subscription',
      items: [
        { description: 'Premium Gym Membership', quantity: 1, unitPrice: 499 }
      ]
    },
    {
      id: 'supplements',
      name: 'Supplements Package',
      description: 'Basic supplements package',
      category: 'product',
      items: [
        { description: 'Protein Powder', quantity: 1, unitPrice: 89 },
        { description: 'BCAA Supplements', quantity: 1, unitPrice: 45 }
      ]
    }
  ];

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = invoiceTemplates.find(t => t.id === templateId);
    if (template) {
      // Auto-populate with template data
      setInvoiceNumber(generateInvoiceNumber());
      const defaults = getSmartDefaults(selectedMember);
      setDueDate(defaults.dueDate || '');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedTemplate || !selectedMember) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    onClose();
  };

  return (
    <SmartBillingModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FiFileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generate Invoice
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create invoice from templates with smart defaults
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
          {/* Member Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FiUser className="w-4 h-4 mr-2" />
              Select Member
            </h3>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Choose a member</option>
              <option value="1">John Doe - Premium</option>
              <option value="2">Sarah Smith - Basic</option>
              <option value="3">Mike Johnson - VIP</option>
            </select>
          </div>

          {/* Template Selection */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FiFileText className="w-4 h-4 mr-2" />
              Invoice Template
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoiceTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.category === 'pt' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      template.category === 'subscription' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {template.category.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {template.items.length} item(s)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Template Details */}
          {selectedTemplate && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                Template Details
              </h4>
              {(() => {
                const template = invoiceTemplates.find(t => t.id === selectedTemplate);
                if (!template) return null;
                
                return (
                  <div className="space-y-2">
                    {template.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-300">
                          {item.description}
                        </span>
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Invoice Details */}
          {selectedTemplate && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiCalendar className="w-4 h-4 mr-2" />
                Invoice Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Suggestions for Pro Users */}
          {isProUser && selectedMember && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    AI Recommendations
                  </h3>
                  <div className="space-y-2 mt-2">
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Member has 2 previous PT sessions this month. Consider package discount.
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Payment history shows preference for monthly billing cycles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2">
              <FiZap className="w-4 h-4" />
              <span>Quick Generate</span>
            </button>
            <button
              onClick={handleGenerateInvoice}
              disabled={isLoading || !selectedTemplate || !selectedMember}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiFileText className="w-4 h-4" />
              )}
              <span>Generate Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </SmartBillingModal>
  );
};

export default GenerateInvoiceModal; 