import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiFileText, FiCheckCircle, FiAlertCircle, FiClock, FiChevronLeft, FiChevronRight, FiMoreHorizontal, FiDownload, FiSend, FiRepeat, FiCopy, FiMessageCircle } from 'react-icons/fi';
import dayjs from 'dayjs';
import { useUI } from '../../contexts/UIContext';

const MOCK_INVOICES = Array.from({ length: 23 }).map((_, i) => ({
  id: `inv-${i + 1}`,
  member: {
    name: `Member ${i + 1}`,
    phone: `+973 3${Math.floor(1000000 + Math.random() * 8999999)}`,
    avatar: '',
    profileUrl: '#'
  },
  type: ['Membership', 'PT', 'Product', 'Other'][i % 4],
  amount: 50 + i * 10,
  vat: 2 + (i % 3),
  status: ['Paid', 'Unpaid', 'Overdue'][i % 3],
  dueDate: dayjs().subtract(i % 5, 'day').format('YYYY-MM-DD'),
  paymentMethod: ['Cash', 'Bank', 'POS', 'Other'][i % 4],

}));

const PAGE_SIZE = 10;

export default function InvoiceTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(MOCK_INVOICES.length / PAGE_SIZE);
  const paginated = MOCK_INVOICES.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginationRef = useRef<HTMLDivElement>(null);
  const { setBottomUIHeight } = useUI();

  useEffect(() => {
    if (paginationRef.current) {
      setBottomUIHeight(paginationRef.current.offsetHeight + 24); // 24px extra margin
    }
    return () => setBottomUIHeight(0);
  }, [setBottomUIHeight, currentPage]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] table-auto">
        <thead>
          <tr className="border-b border-blue-100 dark:border-gray-700 bg-blue-50 dark:bg-gray-700">
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 max-w-[140px] whitespace-nowrap">Invoice ID</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 w-48 whitespace-nowrap">Member</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 w-24 whitespace-nowrap">Type</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 w-32 whitespace-nowrap">Amount</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 w-24 whitespace-nowrap">Status</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 w-32 whitespace-nowrap">Due Date</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 w-32 whitespace-nowrap">Payment</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 w-32 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((inv, idx) => {
            const overdueDays = inv.status === 'Overdue' ? dayjs().diff(dayjs(inv.dueDate), 'day') : 0;
            return (
              <tr key={inv.id} className={`border-b border-blue-50 dark:border-gray-700 ${inv.status === 'Overdue' ? 'bg-red-50/40 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'} transition`}> 
                {/* Invoice ID */}
                <td className="py-3 px-4 max-w-[140px] truncate overflow-hidden whitespace-nowrap text-blue-700 dark:text-blue-300 underline cursor-pointer">
                  {inv.id}
                </td>
                {/* Member Info */}
                <td className="py-3 px-4 flex items-center gap-3 w-48 whitespace-nowrap">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 text-lg">
                    <FiUser />
                  </div>
                  <div>
                    <a href={inv.member.profileUrl} className="font-semibold text-blue-900 dark:text-blue-100 hover:underline whitespace-nowrap">{inv.member.name}</a>
                    <div className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1 whitespace-nowrap">
                      {inv.member.phone}
                    </div>
                  </div>
                </td>
                {/* Type */}
                <td className="py-3 px-4 text-blue-700 dark:text-blue-300 font-medium w-24 whitespace-nowrap">{inv.type}</td>
                {/* Amount */}
                <td className="py-3 px-4 w-32 whitespace-nowrap">
                  <div className="font-bold text-blue-900 dark:text-blue-100">BHD {inv.amount.toFixed(2)}</div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">VAT: {inv.vat.toFixed(2)}</div>
                </td>
                {/* Status */}
                <td className="py-3 px-4 w-24 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold animate-fade-in ${
                    inv.status === 'Paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    inv.status === 'Unpaid' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 animate-pulse'
                  }`}>
                    {inv.status === 'Paid' && <FiCheckCircle className="text-green-500 dark:text-green-400" />}
                    {inv.status === 'Unpaid' && <FiClock className="text-yellow-500 dark:text-yellow-400" />}
                    {inv.status === 'Overdue' && <FiAlertCircle className="text-red-500 dark:text-red-400 animate-pulse" />}
                    {inv.status}
                  </span>
                </td>
                {/* Due Date */}
                <td className="py-3 px-4 w-32 whitespace-nowrap">
                  <div className="text-blue-900 dark:text-blue-100 font-medium">{dayjs(inv.dueDate).format('DD MMM YYYY')}</div>
                  {overdueDays > 0 && (
                    <div className="text-xs text-red-500 dark:text-red-400 font-semibold animate-pulse">+{overdueDays} days overdue</div>
                  )}
                </td>
                {/* Payment Method */}
                <td className="py-3 px-4 w-32 whitespace-nowrap">
                  <select className="rounded-lg border-blue-200 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-gray-200">
                    <option>{inv.paymentMethod}</option>
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>POS</option>
                    <option>Other</option>
                  </select>
                </td>
                {/* Actions */}
                <td className="py-3 px-4 w-32 whitespace-nowrap">
                  <div className="flex gap-2 items-center">
                    <button className="p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 ease-in-out min-h-[44px]" title="View"><FiFileText /></button>
                    <button className="p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 ease-in-out min-h-[44px]" title="Mark as Paid"><FiCheckCircle /></button>
                    <button className="p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 ease-in-out min-h-[44px]" title="Send"><FiSend /></button>
                    <button className="p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 ease-in-out min-h-[44px]" title="Refund"><FiRepeat /></button>
                    <button className="p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 ease-in-out min-h-[44px]" title="Duplicate"><FiCopy /></button>
                    <button className="p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 ease-in-out min-h-[44px]" title="Download PDF"><FiDownload /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Pagination */}
      <div ref={paginationRef} className="flex items-center justify-between mt-4">
        <div className="text-sm text-blue-700">Page {currentPage} of {totalPages}</div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-blue-50 text-blue-500 disabled:opacity-40"><FiChevronLeft /></button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-blue-50 text-blue-500 disabled:opacity-40"><FiChevronRight /></button>
        </div>
      </div>
    </div>
  );
} 