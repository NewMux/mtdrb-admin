import React, { useEffect, useState, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import dayjs from 'dayjs';
import { 
  FiPlus, FiDownload, FiMail, FiFilter, FiRefreshCw, FiTrendingUp, FiAlertCircle, 
  FiDollarSign, FiCalendar, FiUsers, FiClock, FiX, FiChevronDown, 
  FiChevronUp, FiSearch, FiSend, FiEye, FiEdit, FiTrash2, FiSettings, FiSave, 
  FiBookmark, FiZap, FiSmartphone, FiCreditCard, FiDroplet, FiHelpCircle, 
  FiArrowUp, FiArrowDown, FiLoader, FiUser, FiFileText, FiInfo, FiTag, FiPercent, FiPieChart, FiBarChart
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import { 
  Invoice, 
  InvoiceStatus, 
  PaymentMethodType,
  LineItem,
  InvoiceType,
  VatRate
} from '../../types';
import { 
  AppleInput, 
  AppleSelect, 
  AppleTextarea
} from '../AppleStyleModal';
import { SmartButton } from '../ui/DesignSystem';
import { motion, AnimatePresence } from 'framer-motion';

// Smart suggestions for line items
const SMART_SUGGESTIONS = {
  'PT': { description: 'Personal Training Session', type: 'PT', unitPrice: 50, vatRate: 5, currency: 'BHD' },
  'MEMBERSHIP': { description: 'Monthly Membership', type: 'Membership', unitPrice: 100, vatRate: 5, currency: 'BHD' },
  'CLASS': { description: 'Group Fitness Class', type: 'Class', unitPrice: 25, vatRate: 5, currency: 'BHD' },
  'EQUIPMENT': { description: 'Equipment Rental', type: 'Facility', unitPrice: 15, vatRate: 5, currency: 'BHD' },
  'CONSULTATION': { description: 'Fitness Consultation', type: 'PT', unitPrice: 75, vatRate: 5, currency: 'BHD' },
  'SUPPLEMENTS': { description: 'Nutrition Supplements', type: 'Other', unitPrice: 45, vatRate: 5, currency: 'BHD' }
};

// VAT Rate options
const VAT_RATES: { value: VatRate; label: string }[] = [
  { value: 0, label: '0% - Exempt' },
  { value: 5, label: '5% - Standard' },
  { value: 10, label: '10% - Reduced' },
  { value: 15, label: '15% - Premium' }
];

interface ClientHistory {
  lastInvoiceDate: string | null;
  preferredPaymentMethod: string | null;
  outstandingBalance: number;
  overdueInvoices: number;
}

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  classes: any[];
  tenantId: string;
  onSave: () => void;
  invoice: Invoice | null;
}

export function NewInvoiceModal({ 
  isOpen, 
  onClose, 
  clients, 
  classes, 
  tenantId, 
  onSave, 
  invoice: editingInvoice 
}: NewInvoiceModalProps) {
  console.log('NewInvoiceModal rendered with isOpen:', isOpen);
  console.log('Number of clients:', clients.length);
  
  // Invoice Details State
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    type: 'Membership' as InvoiceType,
    status: 'Unpaid' as InvoiceStatus,
    member_id: '',
    issue_date: dayjs().format('YYYY-MM-DD'),
    due_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    payment_method: 'card' as PaymentMethodType,
    paid_amount: 0,
    currency: 'BHD',
    notes: '',
  });

  // Client State
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientHistory, setClientHistory] = useState<ClientHistory>({
    lastInvoiceDate: null,
    preferredPaymentMethod: null,
    outstandingBalance: 0,
    overdueInvoices: 0
  });

  // Line Items State
  const [items, setItems] = useState<LineItem[]>(() => {
    const initialItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: 5 as VatRate,
      discount_percentage: 0,
      total: 0
    };
    initialItem.total = 0; // Will be calculated by calculateItemTotal
    return [initialItem];
  });

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingClientHistory, setIsLoadingClientHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<'details' | 'items' | 'summary'>('details');

  // Calculate totals with smart logic
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const vat_total = items.reduce((sum, item) => sum + ((item.unit_price * item.quantity) * (item.vat_rate / 100)), 0);
  const discount_total = items.reduce((sum, item) => sum + ((item.unit_price * item.quantity) * (item.discount_percentage / 100)), 0);
  const total = subtotal + vat_total - discount_total;
  const remaining_balance = total - invoiceData.paid_amount;

  // Auto-calculate line item totals
  const calculateItemTotal = useCallback((item: LineItem) => {
    return item.quantity * item.unit_price * (1 + item.vat_rate / 100) * (1 - item.discount_percentage / 100);
  }, []);

  useEffect(() => {
    if (editingInvoice) {
      setInvoiceData({
        invoice_number: editingInvoice.invoice_number || '',
        type: editingInvoice.type || 'Membership',
        status: editingInvoice.status || 'Unpaid',
        member_id: editingInvoice.member?.id || '',
        issue_date: editingInvoice.issue_date || dayjs().format('YYYY-MM-DD'),
        due_date: editingInvoice.due_date || dayjs().add(7, 'day').format('YYYY-MM-DD'),
        payment_method: editingInvoice.payment_method || 'card',
        paid_amount: editingInvoice.paid_amount || 0,
        currency: editingInvoice.currency || 'BHD',
        notes: editingInvoice.notes || '',
      });
      setSelectedClient(editingInvoice.member || null);
      if (editingInvoice.line_items && editingInvoice.line_items.length > 0) {
        setItems(editingInvoice.line_items);
      }
    } else {
      // Reset form with smart defaults
      setInvoiceData({
        invoice_number: `INV-${Date.now()}`,
        type: 'Membership' as InvoiceType,
        status: 'Unpaid' as InvoiceStatus,
        member_id: '',
        issue_date: dayjs().format('YYYY-MM-DD'),
        due_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        payment_method: 'card' as PaymentMethodType,
        paid_amount: 0,
        currency: 'BHD',
        notes: '',
      });
      setSelectedClient(null);
      const resetItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: 5 as VatRate,
        discount_percentage: 0,
        total: 0
      };
      resetItem.total = calculateItemTotal(resetItem);
      setItems([resetItem]);
    }
  }, [editingInvoice, calculateItemTotal]);

  const loadClientHistory = useCallback(async (clientId: string) => {
    setIsLoadingClientHistory(true);
    try {
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('issue_date, payment_method')
        .eq('member_id', clientId)
        .order('issue_date', { ascending: false })
        .limit(1)
        .single();

      const { data: outstandingInvoices } = await supabase
        .from('invoices')
        .select('total, due_date')
        .eq('member_id', clientId)
        .eq('status', 'Unpaid');

      const outstandingBalance = outstandingInvoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;
      const overdueInvoices = outstandingInvoices?.filter(inv => 
        dayjs(inv.due_date).isBefore(dayjs())
      ).length || 0;

      setClientHistory({
        lastInvoiceDate: lastInvoice?.issue_date || null,
        preferredPaymentMethod: lastInvoice?.payment_method || null,
        outstandingBalance,
        overdueInvoices
      });

      if (lastInvoice?.payment_method) {
        setInvoiceData(prev => ({ ...prev, payment_method: lastInvoice.payment_method as PaymentMethodType }));
      }

      if (overdueInvoices > 0) {
        toast.error(`Client has ${overdueInvoices} overdue invoice(s)!`, {
          duration: 4000,
          icon: '⚠️'
        });
      }
    } catch (error) {
      console.error('Error loading client history:', error);
    } finally {
      setIsLoadingClientHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClient?.id) {
      loadClientHistory(selectedClient.id);
    }
  }, [selectedClient?.id, loadClientHistory]);

  if (!isOpen) {
    return null;
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    try {
      const newItems = [...items];
      const currentItem = { ...newItems[index] };
      
      if (field === 'quantity') {
        currentItem.quantity = value as number;
      } else if (field === 'vat_rate') {
        currentItem.vat_rate = value as VatRate;
      } else {
        currentItem[field as keyof LineItem] = value as any;
      }
      
      currentItem.total = calculateItemTotal(currentItem);
      newItems[index] = currentItem;
      setItems(newItems);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Error updating item');
    }
  };

  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: 5 as VatRate,
      discount_percentage: 0,
      total: 0
    };
    newItem.total = calculateItemTotal(newItem);
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const applySmartSuggestion = (suggestionKey: string, index: number) => {
    const suggestion = SMART_SUGGESTIONS[suggestionKey as keyof typeof SMART_SUGGESTIONS];
    if (suggestion) {
      handleItemChange(index, 'description', suggestion.description);
      handleItemChange(index, 'unit_price', suggestion.unitPrice);
      handleItemChange(index, 'vat_rate', suggestion.vatRate);
    }
  };

  const handleSave = async (saveAsDraft: boolean = false) => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      toast.error('Please add at least one line item');
      return;
    }

    setIsSaving(true);
    try {
      const action = editingInvoice ? 'updated' : 'created';
      const invoicePayload = {
        invoice_number: invoiceData.invoice_number || `INV-${Date.now()}`,
        type: invoiceData.type,
        status: saveAsDraft ? 'Draft' : invoiceData.status,
        member_id: selectedClient.id,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        payment_method: invoiceData.payment_method,
        paid_amount: invoiceData.paid_amount,
        currency: invoiceData.currency,
        notes: invoiceData.notes,
        subtotal,
        vat_total,
        discount_total,
        total,
        line_items: items,
        tenant_id: tenantId
      };

      let result;
      if (editingInvoice) {
        const { data, error } = await supabase
          .from('invoices')
          .update(invoicePayload)
          .eq('id', editingInvoice.id);
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .insert([invoicePayload]);
        result = { data, error };
      }

      if (result.error) throw result.error;
      
      toast.success(`Invoice ${action} successfully!`);
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast.error(`Failed to save invoice: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          open={isOpen}
          onClose={onClose}
        >
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
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-[#002D9C] via-[#0E5EF2] to-[#7DCCFF] rounded-t-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white">
                        {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                      </Dialog.Title>
                      <p className="text-blue-100 mt-1">
                        Generate a professional invoice for your client
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

                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex space-x-8 px-6">
                    {[
                      { key: 'details', label: 'Invoice Details', icon: FiFileText },
                      { key: 'items', label: 'Line Items', icon: FiDollarSign },
                      { key: 'summary', label: 'Summary', icon: FiPieChart }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveSection(key as any)}
                        className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                          activeSection === key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                  <div className="p-6 space-y-6">
                    {/* Invoice Details Section */}
                    {activeSection === 'details' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Client & Invoice Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FiUser className="mr-2 text-blue-500" />
                            Client & Invoice Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AppleInput
                              label="Invoice Number"
                              name="invoice_number"
                              value={invoiceData.invoice_number}
                              onChange={(e) => setInvoiceData({...invoiceData, invoice_number: e.target.value})}
                              placeholder="INV-12345"
                              required
                            />
                            <AppleSelect
                              label="Status"
                              name="status"
                              value={invoiceData.status}
                              onChange={(e) => setInvoiceData({...invoiceData, status: e.target.value as InvoiceStatus})}
                              required
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Paid">Paid</option>
                              <option value="Overdue">Overdue</option>
                              <option value="Draft">Draft</option>
                              <option value="Cancelled">Cancelled</option>
                            </AppleSelect>
                            <AppleSelect
                              label="Type"
                              value={invoiceData.type}
                              onChange={(e) => setInvoiceData({...invoiceData, type: e.target.value as InvoiceType})}
                            >
                              <option value="Membership">Membership</option>
                              <option value="PT">Personal Training</option>
                              <option value="Class">Class</option>
                              <option value="Facility">Facility</option>
                              <option value="Other">Other</option>
                            </AppleSelect>
                          </div>

                          {/* Client Selection */}
                          <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Client <span className="text-red-500">*</span>
                            </label>
                            <AppleSelect
                              label=""
                              value={selectedClient?.id || ''}
                              onChange={(e) => {
                                try {
                                  const client = clients.find(c => c.id === e.target.value);
                                  setSelectedClient(client || null);
                                } catch (error) {
                                  console.error('Error selecting client:', error);
                                  toast.error('Error selecting client');
                                }
                              }}
                            >
                              <option value="">Select a client...</option>
                              {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.name}
                                </option>
                              ))}
                            </AppleSelect>
                          </div>

                          {/* Client History */}
                          {selectedClient && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <FiInfo className="mr-2 text-blue-500" />
                                Client History
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Last Invoice:</span>
                                  <span className="font-medium ml-2">
                                    {clientHistory.lastInvoiceDate 
                                      ? dayjs(clientHistory.lastInvoiceDate).format('MMM D, YYYY')
                                      : 'None'
                                    }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Outstanding Balance:</span>
                                  <span className={clientHistory.outstandingBalance > 0 ? 'font-medium ml-2 text-red-600' : 'font-medium ml-2 text-green-600'}>
                                    {clientHistory.outstandingBalance.toFixed(3)} BHD
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Overdue Invoices:</span>
                                  <span className={clientHistory.overdueInvoices > 0 ? 'font-medium ml-2 text-red-600' : 'font-medium ml-2 text-green-600'}>
                                    {clientHistory.overdueInvoices}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Preferred Payment:</span>
                                  <span className="font-medium ml-2">
                                    {clientHistory.preferredPaymentMethod || 'Not set'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Dates Section */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FiCalendar className="mr-2 text-green-500" />
                            Invoice Dates
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AppleInput
                              label="Issue Date"
                              name="issue_date"
                              type="date"
                              value={invoiceData.issue_date}
                              onChange={(e) => setInvoiceData({...invoiceData, issue_date: e.target.value})}
                              required
                            />
                            <AppleInput
                              label="Due Date"
                              name="due_date"
                              type="date"
                              value={invoiceData.due_date}
                              onChange={(e) => setInvoiceData({...invoiceData, due_date: e.target.value})}
                              min={invoiceData.issue_date}
                              required
                            />
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FiCreditCard className="mr-2 text-purple-500" />
                            Payment Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AppleSelect
                              label="Payment Method"
                              value={invoiceData.payment_method}
                              onChange={(e) => setInvoiceData({...invoiceData, payment_method: e.target.value as PaymentMethodType})}
                            >
                              <option value="">Select payment method</option>
                              <option value="card">Credit/Debit Card</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="cash">Cash</option>
                              <option value="digital_wallet">Digital Wallet</option>
                              <option value="cheque">Cheque</option>
                            </AppleSelect>
                            <AppleInput
                              label="Paid Amount"
                              type="number"
                              step="0.01"
                              value={invoiceData.paid_amount}
                              onChange={(e) => setInvoiceData({...invoiceData, paid_amount: parseFloat(e.target.value) || 0})}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Line Items Section */}
                    {activeSection === 'items' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <FiDollarSign className="mr-2 text-green-500" />
                              Line Items
                            </h3>
                            <SmartButton
                              onClick={addItem}
                              variant="secondary"
                              size="sm"
                              icon={<FiPlus className="h-4 w-4" />}
                            >
                              Add Item
                            </SmartButton>
                          </div>

                          <div className="space-y-4">
                            {items.map((item, index) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200"
                              >
                                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                                  {/* Description */}
                                  <div className="lg:col-span-2">
                                    <AppleInput
                                      label="Description"
                                      value={item.description}
                                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                      placeholder="Enter item description"
                                    />
                                    {/* Smart Suggestions */}
                                    {!item.description && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {Object.entries(SMART_SUGGESTIONS).map(([key, suggestion]) => (
                                          <button
                                            key={key}
                                            onClick={() => applySmartSuggestion(key, index)}
                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                          >
                                            {suggestion.description}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Quantity */}
                                  <div>
                                    <AppleInput
                                      label="Quantity"
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                      min={1}
                                    />
                                  </div>

                                  {/* Unit Price */}
                                  <div>
                                    <AppleInput
                                      label="Unit Price"
                                      type="number"
                                      step="0.01"
                                      value={item.unit_price}
                                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                      placeholder="0.00"
                                    />
                                  </div>

                                  {/* VAT Rate */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      VAT Rate
                                    </label>
                                    <select
                                      value={item.vat_rate}
                                      onChange={(e) => handleItemChange(index, 'vat_rate', parseInt(e.target.value))}
                                      className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-200 ease-out"
                                    >
                                      {VAT_RATES.map(rate => (
                                        <option key={rate.value} value={rate.value}>
                                          {rate.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Total */}
                                  <div className="flex items-end">
                                    <div className="w-full">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total
                                      </label>
                                      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl text-gray-900 font-medium border border-green-200">
                                        {item.total.toFixed(3)} BHD
                                      </div>
                                    </div>
                                    {items.length > 1 && (
                                      <button
                                        onClick={() => removeItem(index)}
                                        className="ml-2 p-2 text-red-500 hover:text-red-700 transition-colors"
                                      >
                                        <FiTrash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Summary Section */}
                    {activeSection === 'summary' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Invoice Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FiBarChart className="mr-2 text-purple-500" />
                            Invoice Summary
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{subtotal.toFixed(3)} BHD</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">VAT:</span>
                                <span className="font-medium">{vat_total.toFixed(3)} BHD</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-medium text-red-600">-{discount_total.toFixed(3)} BHD</span>
                              </div>
                              <div className="border-t pt-2">
                                <div className="flex justify-between">
                                  <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                                  <span className="text-lg font-semibold text-blue-600">{total.toFixed(3)} BHD</span>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Paid Amount:</span>
                                <span className="font-medium">{invoiceData.paid_amount.toFixed(3)} BHD</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Remaining Balance:</span>
                                <span className={remaining_balance > 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                                  {remaining_balance.toFixed(3)} BHD
                                </span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <AppleInput
                                label="Paid Amount"
                                type="number"
                                step="0.01"
                                value={invoiceData.paid_amount}
                                onChange={(e) => setInvoiceData({...invoiceData, paid_amount: parseFloat(e.target.value) || 0})}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FiFileText className="mr-2 text-orange-500" />
                            Notes
                          </h3>
                          <AppleTextarea
                            label="Notes"
                            value={invoiceData.notes}
                            onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                            placeholder="Notes for internal use..."
                            rows={3}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          if (activeSection === 'details') {
                            setActiveSection('items');
                          } else if (activeSection === 'items') {
                            setActiveSection('summary');
                          } else {
                            setActiveSection('details');
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {(() => {
                          if (activeSection === 'details') return 'Next: Line Items';
                          if (activeSection === 'items') return 'Next: Summary';
                          return 'Back to Details';
                        })()}
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <SmartButton variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancel
                      </SmartButton>
                      <SmartButton 
                        variant="secondary" 
                        onClick={() => handleSave(true)} 
                        loading={isSaving} 
                        disabled={isSaving}
                      >
                        Save as Draft
                      </SmartButton>
                      <SmartButton 
                        onClick={() => handleSave(false)} 
                        loading={isSaving} 
                        disabled={isSaving}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      >
                        {isSaving ? 'Saving...' : 'Save Invoice'}
                      </SmartButton>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
