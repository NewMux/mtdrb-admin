import React from "react";
import { SmartButton } from "./DesignSystem";
import { FiFilter } from "react-icons/fi";

const FilterButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (
  props,
) => (
  <SmartButton
    variant="ghost"
    size="sm"
    icon={<FiFilter className="w-5 h-5" />}
    className="p-2"
    {...props}
    aria-label="Filter"
  />
);

export default FilterButton;
