import React from "react";
import { motion } from "framer-motion";
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
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white focus:ring-gray-500",
    floating:
      "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const floatingClasses =
    variant === "floating"
      ? "fixed bottom-6 right-6 w-14 h-14 rounded-full p-0"
      : "";

  return (
    <motion.button
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1.02 },
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
      <FiPlus className={`${iconSizes[size]} ${label ? "mr-2" : ""}`} />
      {label && <span>{label}</span>}
    </motion.button>
  );
};

export default AddButton;
