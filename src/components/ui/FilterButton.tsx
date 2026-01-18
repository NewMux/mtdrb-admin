import React from "react";
import { SmartButton } from "./DesignSystem";
import { FiFilter } from "react-icons/fi";

interface FilterButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  title?: string;
  "aria-label"?: string;
  active?: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, className, ...props }) => (
  <SmartButton
    variant={active ? "primary" : "ghost"}
    size="sm"
    icon={<FiFilter className="w-5 h-5" />}
    className={`p-2 ${active ? "bg-blue-100 text-blue-700" : ""} ${className || ""}`}
    {...props}
    aria-label="Filter"
  />
);

export default FilterButton;
