import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FiX, FiPlus, FiTrash2, FiUser, FiCalendar, FiDollarSign, FiFileText, FiCreditCard, FiPercent, FiBarChart2 } from 'react-icons/fi';
import { AppleInput, AppleSelect, AppleTextarea, AppleButton } from '../AppleStyleModal';
import dayjs from 'dayjs';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  onSave: () => void;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercent: number;
  total: number;
}

interface InvoiceData {
  memberId: string;
  invoiceNumber: string;
  status: 'Unpaid' | 'Paid' | 'Draft' | 'Cancelled';
  type: 'Membership' | 'Product' | 'Service' | 'Subscription';
  issueDate: string;
  dueDate: string;
  paymentMethod: 'card' | 'cash' | 'bank' | 'other';
  paidAmount: number;
  currency: string;
  notes: string;
}

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSave
}) => {
  // Form state
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    memberId: '',
    invoiceNumber: `INV-${Date.now()}`,
    status: 'Unpaid',
    type: 'Membership',
    issueDate: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    paymentMethod: 'card',
    paidAmount: 0,
    currency: 'BHD',
    notes: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 5,
      discountPercent: 0,
      total: 0
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate totals
  const calculateLineItemTotal = useCallback((item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = subtotal * (item.vatRate / 100);
    const discountAmount = subtotal * (item.discountPercent / 100);
    return subtotal + vatAmount - discountAmount;
  }, []);

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vatTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);
  const discountTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discountPercent / 100)), 0);
  const grandTotal = subtotal + vatTotal - discountTotal;
  const remainingBalance = grandTotal - invoiceData.paidAmount;

  // Update line item totals when values change
  useEffect(() => {
    setLineItems(prev => prev.map(item => ({
      ...item,
      total: calculateLineItemTotal(item)
    })));
  }, [calculateLineItemTotal]);

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 5,
      discountPercent: 0,
      total: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!invoiceData.memberId) {
      newErrors.memberId = 'Please select a member';
    }

    if (!invoiceData.invoiceNumber) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (lineItems.some(item => !item.description)) {
      newErrors.lineItems = 'All line items must have a description';
    }

    if (grandTotal <= 0) {
      newErrors.total = 'Invoice total must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async (saveAsDraft: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const invoicePayload = {
        ...invoiceData,
        status: saveAsDraft ? 'Draft' : invoiceData.status,
        lineItems,
        subtotal,
        vatTotal,
        discountTotal,
        grandTotal,
        remainingBalance
      };

      console.log('Saving invoice:', invoicePayload);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-suggest line item for membership
  useEffect(() => {
    if (invoiceData.type === 'Membership' && lineItems.length === 1 && !lineItems[0].description) {
      updateLineItem(lineItems[0].id, 'description', 'Monthly Gym Membership');
      updateLineItem(lineItems[0].id, 'unitPrice', 100);
    }
  }, [invoiceData.type]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-4xl h-screen align-middle text-left bg-white rounded-2xl shadow-2xl transform transition-all">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#002D9C] to-[#0E5EF2] rounded-t-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-white">
                      Add New Invoice
                    </Dialog.Title>
                    <p className="text-blue-100 mt-1">
                      Create a professional invoice for your client
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-blue-100 transition-colors"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex h-[calc(100vh-120px)]">
                {/* Main Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Client Info Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiUser className="w-4 h-4 mr-2" />
                      Client Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AppleSelect
                        label="Member"
                        value={invoiceData.memberId}
                        onChange={(e) => setInvoiceData({...invoiceData, memberId: e.target.value})}
                        required
                        error={errors.memberId}
                      >
                        <option value="">Select a member</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name} - {client.email}
                          </option>
                        ))}
                      </AppleSelect>

                      <AppleInput
                        label="Invoice Number"
                        value={invoiceData.invoiceNumber}
                        onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                        required
                        error={errors.invoiceNumber}
                      />

                      <AppleSelect
                        label="Status"
                        value={invoiceData.status}
                        onChange={(e) => setInvoiceData({...invoiceData, status: e.target.value as any})}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                        <option value="Draft">Draft</option>
                        <option value="Cancelled">Cancelled</option>
                      </AppleSelect>

                      <AppleSelect
                        label="Type"
                        value={invoiceData.type}
                        onChange={(e) => setInvoiceData({...invoiceData, type: e.target.value as any})}
                      >
                        <option value="Membership">Membership</option>
                        <option value="Product">Product</option>
                        <option value="Service">Service</option>
                        <option value="Subscription">Subscription</option>
                      </AppleSelect>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AppleInput
                        label="Issue Date"
                        type="date"
                        value={invoiceData.issueDate}
                        onChange={(e) => setInvoiceData({...invoiceData, issueDate: e.target.value})}
                      />

                      <AppleInput
                        label="Due Date"
                        type="date"
                        value={invoiceData.dueDate}
                        onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Payment Info Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiCreditCard className="w-4 h-4 mr-2" />
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AppleSelect
                        label="Payment Method"
                        value={invoiceData.paymentMethod}
                        onChange={(e) => setInvoiceData({...invoiceData, paymentMethod: e.target.value as any})}
                      >
                        <option value="card">Card</option>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="other">Other</option>
                      </AppleSelect>

                      <AppleInput
                        label="Paid Amount"
                        type="number"
                        value={invoiceData.paidAmount}
                        onChange={(e) => setInvoiceData({...invoiceData, paidAmount: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Line Items Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <FiFileText className="w-4 h-4 mr-2" />
                        Line Items
                      </h3>
                      <AppleButton
                        onClick={addLineItem}
                        variant="secondary"
                        size="sm"
                        icon={<FiPlus className="w-4 h-4" />}
                      >
                        Add Item
                      </AppleButton>
                    </div>

                    <div className="space-y-4">
                      {lineItems.map((item, index) => (
                        <div key={item.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">Item {index + 1}</h4>
                            {lineItems.length > 1 && (
                              <button
                                onClick={() => removeLineItem(item.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-6">
                              <AppleInput
                                label="Description"
                                value={item.description}
                                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                placeholder="Item description"
                                required
                              />
                            </div>
                            <div className="col-span-2">
                              <AppleInput
                                label="Quantity"
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                min="1"
                              />
                            </div>
                            <div className="col-span-2">
                              <AppleInput
                                label="Unit Price"
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                step="0.01"
                              />
                            </div>
                            <div className="col-span-1">
                              <AppleInput
                                label="VAT %"
                                type="number"
                                value={item.vatRate}
                                onChange={(e) => updateLineItem(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div className="col-span-1">
                              <AppleInput
                                label="Discount %"
                                type="number"
                                value={item.discountPercent}
                                onChange={(e) => updateLineItem(item.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>

                          <div className="mt-3 text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Total: {invoiceData.currency} {item.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {errors.lineItems && (
                      <p className="text-sm text-red-500 mt-2">{errors.lineItems}</p>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">Notes</h3>
                    <AppleTextarea
                      label="Internal Notes"
                      value={invoiceData.notes}
                      onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                      rows={3}
                      placeholder="Add any internal notes..."
                    />
                  </div>
                </div>

                {/* Summary Panel */}
                <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
                  <div className="sticky top-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiBarChart2 className="w-4 h-4 mr-2" />
                      Summary
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-medium">{invoiceData.currency} {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">VAT:</span>
                        <span className="font-medium">{invoiceData.currency} {vatTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                        <span className="font-medium text-green-600">-{invoiceData.currency} {discountTotal.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">Grand Total:</span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {invoiceData.currency} {grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Paid Amount:</span>
                        <span className="font-medium">{invoiceData.currency} {invoiceData.paidAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">Remaining:</span>
                          <span className={`text-lg font-semibold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {invoiceData.currency} {remainingBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {errors.total && (
                      <p className="text-sm text-red-500 mt-3">{errors.total}</p>
                    )}

                    <div className="mt-6 space-y-3">
                      <AppleButton
                        onClick={() => handleSave(false)}
                        variant="primary"
                        loading={isLoading}
                        className="w-full"
                      >
                        Save Invoice
                      </AppleButton>
                      <AppleButton
                        onClick={() => handleSave(true)}
                        variant="secondary"
                        loading={isLoading}
                        className="w-full"
                      >
                        Save as Draft
                      </AppleButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AddInvoiceModal; 