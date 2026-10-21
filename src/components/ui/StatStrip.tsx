import React from "react";

export interface StatItem {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Secondary line under the value (change, context). */
  detail?: React.ReactNode;
  /** Trailing control on the label row, e.g. a "Target" button. */
  accessory?: React.ReactNode;
  /** 0-100; renders a thin level meter under the value. */
  meter?: number;
  /** Tailwind bg class for the meter fill. Defaults to the accent. */
  meterClass?: string;
}

interface StatStripProps {
  items: StatItem[];
  className?: string;
}

/**
 * Summary numbers as one grouped strip divided by hairlines, the way a Mac
 * app shows a status summary, instead of a grid of separate cards. The
 * 1px gap over a separator-colored track draws the dividers at every
 * breakpoint without per-cell border bookkeeping.
 */
export const StatStrip: React.FC<StatStripProps> = ({ items, className = "" }) => {
  const cols =
    items.length >= 4
      ? "grid-cols-2 lg:grid-cols-4"
      : items.length === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-2";
  return (
    <div
      className={`grid ${cols} gap-px rounded-xl overflow-hidden bg-black/[0.06] dark:bg-white/[0.08] ${className}`}
    >
      {items.map((item, index) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-800 px-4 py-3 text-start min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.label}</span>
            {item.accessory}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white truncate">
            {item.value}
          </div>
          {item.meter !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div
                className="flex-1 h-1 rounded-full bg-black/[0.08] dark:bg-white/10 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(item.meter)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-1 rounded-full ${item.meterClass ?? "bg-blue-600 dark:bg-blue-500"}`}
                  style={{ width: `${Math.max(0, Math.min(item.meter, 100))}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {Math.round(item.meter)}%
              </span>
            </div>
          )}
          {item.detail && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{item.detail}</div>
          )}
        </div>
      ))}
    </div>
  );
};
