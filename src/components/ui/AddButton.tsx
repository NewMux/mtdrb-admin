import * as React from 'react';
import { SmartButton } from './DesignSystem';
import { FiPlus } from 'react-icons/fi';

interface AddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const AddButton: React.FC<AddButtonProps> = ({ label, className = '', ...props }) => {
  return (
    <SmartButton
      variant="secondary"
      size="sm"
      icon={<FiPlus className="w-4 h-4" />}
      iconPosition="left"
      className={`gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-150 ${className}`}
      {...props}
    >
      {label}
    </SmartButton>
  );
};

export default AddButton; 