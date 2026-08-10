import React from "react";

interface BillingTabProps {
  plan: unknown;
  invoices: unknown[];
  onSendPaymentLink: () => void;
  onMarkPaid: () => void;
  onCreditNote: () => void;
}

const BillingTab: React.FC<BillingTabProps> = () => {
  return (
    <div className="p-6">
      {/* TODO: Plan details, invoices table, actions */}
    </div>
  );
};

export default BillingTab;
