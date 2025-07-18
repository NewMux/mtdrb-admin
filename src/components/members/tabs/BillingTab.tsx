import React from 'react';

interface BillingTabProps {
  plan: any;
  invoices: any[];
  onSendPaymentLink: () => void;
  onMarkPaid: () => void;
  onCreditNote: () => void;
}

const BillingTab: React.FC<BillingTabProps> = ({ plan, invoices, onSendPaymentLink, onMarkPaid, onCreditNote }) => {
  return (
    <div className="p-6">{/* TODO: Plan details, invoices table, actions */}</div>
  );
};

export default BillingTab; 