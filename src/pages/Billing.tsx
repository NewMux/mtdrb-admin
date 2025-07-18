import * as React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiDollarSign, FiCreditCard, FiBarChart, FiSettings, FiDownload, FiFileText, FiShoppingCart } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import SmartBillingDashboard from '../components/billing/SmartBillingDashboard';
import SmartVatDashboard from '../components/billing/SmartVatDashboard';
import BillingKPICards from '../components/billing/BillingKPICards';
import SmartBillingAnalytics from '../components/billing/SmartBillingAnalytics';
import { NewInvoiceModal } from '../components/billing/NewInvoiceModal';
import ExportBillingDataModal from '../components/billing/modals/ExportBillingDataModal';
import AddExpenseModal from '../components/billing/AddExpenseModal';
import AddInvoiceModal from '../components/billing/AddInvoiceModal';
import { AnimatePresence } from 'framer-motion';
import FilterButton from '../components/ui/FilterButton';
import TabsNav from '../components/ui/TabsNav';
import AddButton from '../components/ui/AddButton';
import { SmartButton } from '../components/ui/DesignSystem';
import { SmartModal } from '../components/ui/SmartModal';
import { usePageThemeContext } from '../contexts/PageThemeContext';

import { mockInvoices, mockExpenses } from '../api/mockBillingData';

// Mock clients for the invoice modal
const mockClients = [
  { id: 'member-1', name: 'Jane Doe', email: 'jane@example.com', phone: '+1111111111' },
  { id: 'member-2', name: 'John Smith', email: 'john@example.com', phone: '+2222222222' },
  { id: 'member-3', name: 'Emily Lee', email: 'emily@example.com', phone: '+3333333333' },
  { id: 'member-4', name: 'Mike Johnson', email: 'mike@example.com', phone: '+4444444444' },
  { id: 'member-5', name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+5555555555' },
  { id: 'member-6', name: 'David Brown', email: 'david@example.com', phone: '+6666666666' },
  { id: 'member-7', name: 'Lisa Garcia', email: 'lisa@example.com', phone: '+7777777777' },
  { id: 'member-8', name: 'Tom Anderson', email: 'tom@example.com', phone: '+8888888888' },
];

const Billing: React.FC = () => {
  const { theme } = usePageThemeContext();
  
  // Log that the component is loading
  React.useEffect(() => {
    console.log('✅ Billing page loaded successfully');
    console.log('✅ All modals and handlers are properly configured');
  }, []);

  const [activeTab, setActiveTab] = React.useState('overview');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [activeModal, setActiveModal] = React.useState<'createInvoice' | 'addInvoice' | 'export' | 'expense' | 'viewInvoice' | 'editInvoice' | 'viewExpense' | 'editExpense' | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);
  const [selectedExpense, setSelectedExpense] = React.useState<any>(null);
  const [refreshKey, setRefreshKey] = React.useState(Date.now());
  
  // Settings state management
  const [settings, setSettings] = React.useState({
    autoInvoicing: true,
    paymentReminders: true,
    vatEnabled: false,
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiDollarSign },
    { id: 'invoices', name: 'Invoices', icon: FiFileText },
    { id: 'expenses', name: 'Expenses', icon: FiShoppingCart },
    { id: 'analytics', name: 'Analytics', icon: FiBarChart },
    { id: 'vat', name: 'VAT Reports', icon: FiCreditCard },
    { id: 'settings', name: 'Settings', icon: FiSettings },
  ];

  const filters = [
    { id: 'all', name: 'All Transactions', count: 1247 },
    { id: 'paid', name: 'Paid', count: 1189 },
    { id: 'pending', name: 'Pending', count: 45 },
    { id: 'overdue', name: 'Overdue', count: 13 },
  ];

  // Button handlers
  const handleExportReports = () => {
    console.log('✅ Export Reports button clicked');
    toast.success("Reports exported successfully!");
    console.log("Mock export: Billing reports downloaded");
  };

  const handleRefreshData = () => {
    console.log('✅ Refresh Data button clicked');
    setRefreshKey(Date.now());
    toast.success("Data refreshed!");
  };

  const handleSettingsChange = (setting: keyof typeof settings) => {
    console.log(`✅ Setting changed: ${setting}`);
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    toast.success(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} setting updated`);
  };

  // Table action handlers
  const handleViewInvoice = (invoice: any) => {
    console.log('✅ View invoice clicked:', invoice);
    setSelectedInvoice(invoice);
    setActiveModal('viewInvoice');
  };

  const handleEditInvoice = (invoice: any) => {
    console.log('✅ Edit invoice clicked:', invoice);
    setSelectedInvoice(invoice);
    setActiveModal('editInvoice');
  };

  const handleViewExpense = (expense: any) => {
    console.log('✅ View expense clicked:', expense);
    setSelectedExpense(expense);
    setActiveModal('viewExpense');
  };

  const handleEditExpense = (expense: any) => {
    console.log('✅ Edit expense clicked:', expense);
    setSelectedExpense(expense);
    setActiveModal('editExpense');
  };

  // Invoice and Expense list components
  const InvoiceList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoices</h2>
        <button
          onClick={() => {
            console.log('✅ Add Invoice button clicked');
            setActiveModal('addInvoice');
          }}
          className="bg-gradient-to-r from-[#0E5EF2] to-[#7DCCFF] text-white px-4 py-2 rounded-xl shadow-md hover:opacity-90 transition flex items-center space-x-2"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Invoice</span>
        </button>
      </div>
      
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Invoice #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Member</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.slice(0, 10).map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.invoice_number}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                    {invoice.member?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      invoice.status === 'Unpaid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewInvoice(invoice)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                        title={`View invoice ${invoice.invoice_number}`}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditInvoice(invoice)}
                        className="px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-green-200 hover:border-green-300"
                        title={`Edit invoice ${invoice.invoice_number}`}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ExpenseList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expenses</h2>
                  <SmartButton
            onClick={() => {
              console.log('✅ Add Expense button clicked (expenses tab)');
              setActiveModal('expense');
            }}
            variant="primary"
          >
            Add Expense
          </SmartButton>
      </div>
      
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockExpenses.slice(0, 10).map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {expense.title}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                    {expense.category}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      expense.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      expense.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewExpense(expense)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                        title={`View expense ${expense.title}`}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditExpense(expense)}
                        className="px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium transition-colors cursor-pointer border border-green-200 hover:border-green-300"
                        title={`Edit expense ${expense.title}`}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage payments, invoices, and financial reports</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
            onClick={handleExportReports}
            aria-label="Export Reports"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export Reports</span>
          </button>
          <SmartButton
            onClick={() => {
              console.log('✅ Add Expense button clicked');
              setActiveModal('expense');
            }}
            variant="secondary"
          >
            Add Expense
          </SmartButton>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search invoices, payments, or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
              aria-label="Search billing data"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="form-select"
              aria-label="Filter transactions"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name} ({filter.count})
                </option>
              ))}
            </select>
            
            <FilterButton />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabsNav
        tabs={tabs.map(tab => ({ id: tab.id, label: tab.name, icon: <tab.icon className="w-4 h-4" /> }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <BillingKPICards />
              
              {/* Billing Dashboard */}
              <SmartBillingDashboard refreshKey={refreshKey} />
            </div>
          )}

          {activeTab === 'invoices' && (
            <InvoiceList />
          )}

          {activeTab === 'expenses' && (
            <ExpenseList />
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <SmartBillingAnalytics refreshKey={refreshKey} />
            </div>
          )}

          {activeTab === 'vat' && (
            <div className="space-y-6">
              <SmartVatDashboard tenantId="gym-default" refreshKey={refreshKey} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Auto-invoicing</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically generate invoices</p>
                    </div>
                    <button 
                      className={`w-12 h-6 rounded-full ${
                        settings.autoInvoicing ? "bg-sky-500" : "bg-gray-300"
                      } flex items-center justify-${settings.autoInvoicing ? "end" : "start"} px-1 transition-colors`}
                      onClick={() => handleSettingsChange('autoInvoicing')}
                      aria-label={`${settings.autoInvoicing ? 'Disable' : 'Enable'} auto-invoicing`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Payment reminders</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Send automatic payment reminders</p>
                    </div>
                    <button 
                      className={`w-12 h-6 rounded-full ${
                        settings.paymentReminders ? "bg-sky-500" : "bg-gray-300"
                      } flex items-center justify-${settings.paymentReminders ? "end" : "start"} px-1 transition-colors`}
                      onClick={() => handleSettingsChange('paymentReminders')}
                      aria-label={`${settings.paymentReminders ? 'Disable' : 'Enable'} payment reminders`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">VAT enabled</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Include VAT in invoices</p>
                    </div>
                    <button 
                      className={`w-12 h-6 rounded-full ${
                        settings.vatEnabled ? "bg-sky-500" : "bg-gray-300"
                      } flex items-center justify-${settings.vatEnabled ? "end" : "start"} px-1 transition-colors`}
                      onClick={() => handleSettingsChange('vatEnabled')}
                      aria-label={`${settings.vatEnabled ? 'Disable' : 'Enable'} VAT`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {activeModal === 'addInvoice' && (
        <AddInvoiceModal
          isOpen={activeModal === 'addInvoice'}
          onClose={() => {
            console.log('✅ Add Invoice modal closed');
            setActiveModal(null);
          }}
          clients={mockClients}
          onSave={() => {
            console.log('✅ Invoice saved successfully');
            setRefreshKey(Date.now());
            toast.success('Invoice created successfully!');
          }}
        />
      )}
      
      {activeModal === 'createInvoice' && (
        <NewInvoiceModal
          isOpen={activeModal === 'createInvoice'}
          onClose={() => {
            console.log('✅ Create Invoice modal closed');
            setActiveModal(null);
          }}
          clients={mockClients}
          classes={[]}
          tenantId="gym-default"
          onSave={() => {
            console.log('✅ Invoice saved successfully');
            setRefreshKey(Date.now());
          }}
          invoice={null}
        />
      )}
      
      {activeModal === 'export' && (
        <ExportBillingDataModal
          open={activeModal === 'export'}
          onClose={() => {
            console.log('✅ Export modal closed');
            setActiveModal(null);
          }}
        />
      )}
      
      {activeModal === 'expense' && (
        <AddExpenseModal
          isOpen={activeModal === 'expense'}
          onClose={() => {
            console.log('✅ Add Expense modal closed');
            setActiveModal(null);
          }}
          onExpenseAdded={() => {
            setActiveModal(null);
            setRefreshKey(Date.now());
            toast.success('Expense added successfully!');
          }}
          tenantId={null} // TODO: Replace with actual tenantId if available
          expense={null}
        />
      )}

      {/* View Invoice Modal */}
      {activeModal === 'viewInvoice' && selectedInvoice && (
        <SmartModal
          isOpen={activeModal === 'viewInvoice'}
          onClose={() => {
            console.log('✅ View Invoice modal closed');
            setActiveModal(null);
            setSelectedInvoice(null);
          }}
          title={`View Invoice: ${selectedInvoice.invoice_number}`}
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="ghost" onClick={() => {
                setActiveModal(null);
                setSelectedInvoice(null);
              }}>
                Close
              </SmartButton>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedInvoice.member?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">${selectedInvoice.total.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedInvoice.payment_method}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Line Items</h3>
              <div className="space-y-2">
                {selectedInvoice.line_items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.unit_price}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SmartModal>
      )}

      {/* Edit Invoice Modal */}
      {activeModal === 'editInvoice' && selectedInvoice && (
        <SmartModal
          isOpen={activeModal === 'editInvoice'}
          onClose={() => {
            console.log('✅ Edit Invoice modal closed');
            setActiveModal(null);
            setSelectedInvoice(null);
          }}
          title={`Edit Invoice: ${selectedInvoice.invoice_number}`}
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="ghost" onClick={() => {
                setActiveModal(null);
                setSelectedInvoice(null);
              }}>
                Cancel
              </SmartButton>
              <SmartButton variant="primary" onClick={() => {
                console.log('✅ Invoice updated:', selectedInvoice);
                toast.success(`Invoice ${selectedInvoice.invoice_number} updated successfully!`);
                setActiveModal(null);
                setSelectedInvoice(null);
              }}>
                Save Changes
              </SmartButton>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Edit Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select 
                    defaultValue={selectedInvoice.status}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                  <select 
                    defaultValue={selectedInvoice.payment_method}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Notes</h3>
              <textarea
                defaultValue={selectedInvoice.notes}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Add notes..."
              />
            </div>
          </div>
        </SmartModal>
      )}

      {/* View Expense Modal */}
      {activeModal === 'viewExpense' && selectedExpense && (
        <SmartModal
          isOpen={activeModal === 'viewExpense'}
          onClose={() => {
            console.log('✅ View Expense modal closed');
            setActiveModal(null);
            setSelectedExpense(null);
          }}
          title={`View Expense: ${selectedExpense.title}`}
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="ghost" onClick={() => {
                setActiveModal(null);
                setSelectedExpense(null);
              }}>
                Close
              </SmartButton>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Expense Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedExpense.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">${selectedExpense.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedExpense.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedExpense.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedExpense.vendor || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedExpense.description && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Description</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedExpense.description}</p>
              </div>
            )}
          </div>
        </SmartModal>
      )}

      {/* Edit Expense Modal */}
      {activeModal === 'editExpense' && selectedExpense && (
        <SmartModal
          isOpen={activeModal === 'editExpense'}
          onClose={() => {
            console.log('✅ Edit Expense modal closed');
            setActiveModal(null);
            setSelectedExpense(null);
          }}
          title={`Edit Expense: ${selectedExpense.title}`}
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="ghost" onClick={() => {
                setActiveModal(null);
                setSelectedExpense(null);
              }}>
                Cancel
              </SmartButton>
              <SmartButton variant="primary" onClick={() => {
                console.log('✅ Expense updated:', selectedExpense);
                toast.success(`Expense "${selectedExpense.title}" updated successfully!`);
                setActiveModal(null);
                setSelectedExpense(null);
              }}>
                Save Changes
              </SmartButton>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Edit Expense Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    defaultValue={selectedExpense.title}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select 
                    defaultValue={selectedExpense.category}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="operational">Operational</option>
                    <option value="capital">Capital</option>
                    <option value="marketing">Marketing</option>
                    <option value="staff">Staff</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    defaultValue={selectedExpense.amount}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select 
                    defaultValue={selectedExpense.status}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Description</h3>
              <textarea
                defaultValue={selectedExpense.description}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Add description..."
              />
            </div>
          </div>
        </SmartModal>
      )}
    </div>
  );
};

export default Billing;
