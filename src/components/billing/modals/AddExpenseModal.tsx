import React, { useState } from "react";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { AppleInput, AppleSelect, AppleTextarea } from "../../AppleStyleModal";

type ExpenseFormData = {
  vendor: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  receipt: File | null;
};

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    vendor: "",
    description: "",
    amount: "",
    category: "",
    date: "",
    receipt: null as File | null,
  });

  const handleSubmit = async (
    e?: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>,
  ) => {
    e?.preventDefault();
    // TODO: Implement expense creation logic
    onSuccess();
    onClose();
  };

  const handleChange = <K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      footer={
        <div className="flex justify-end space-x-3">
          <SmartButton variant="secondary" onClick={onClose}>
            Cancel
          </SmartButton>
          <SmartButton variant="primary" onClick={handleSubmit}>
            Add Expense
          </SmartButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppleInput
            label="Vendor"
            value={formData.vendor}
            onChange={(e) => handleChange("vendor", e.target.value)}
            required
          />
          <AppleInput
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            required
          />
        </div>

        <AppleTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppleSelect
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            required
          >
            <option value="">Select category</option>
            <option value="utilities">Utilities</option>
            <option value="equipment">Equipment</option>
            <option value="maintenance">Maintenance</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </AppleSelect>
          <AppleInput
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            required
          />
        </div>
      </form>
    </SmartModal>
  );
};

export default AddExpenseModal;
