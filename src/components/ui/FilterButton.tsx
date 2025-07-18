import React from 'react';
import { FiFilter } from 'react-icons/fi';

const FilterButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    type="button"
    className="p-2 rounded-full border border-gray-300 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition shadow-sm"
    {...props}
    aria-label="Filter"
  >
    <FiFilter className="w-5 h-5" />
  </button>
);

export default FilterButton; 