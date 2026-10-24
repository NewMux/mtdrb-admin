import React from "react";
import { m as motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";

interface AddButtonProps {
  onClick: () => void;
  label?: string;
  variant?: "primary" | "secondary" | "floating";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  label = "Add",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors duration-100 focus:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:cursor-default select-none";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm",
    secondary:
      "bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 shadow-sm",
    floating: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-sm",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const floatingClasses =
    variant === "floating"
      ? "fixed bottom-6 right-6 w-14 h-14 rounded-full p-0"
      : "";

  return (
    <motion.button
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1 },
        pressed: { scale: 0.98 },
      }}
      initial="rest"
      whileHover="hover"
      whileTap="pressed"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${floatingClasses}
        ${className}
      `}
    >
      <FiPlus className={iconSizes[size]} />
      {label && <span>{label}</span>}
    </motion.button>
  );
};

export default AddButton;
