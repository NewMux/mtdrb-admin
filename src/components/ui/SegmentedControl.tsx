import React from "react";

export interface Segment<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Accessible name for the group. */
  label?: string;
}

/**
 * NSSegmentedControl look: a recessed track with the selected segment raised
 * on a white "key". Used for switching between views of the same content.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className = "",
  label,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`mac-segmented max-w-full overflow-x-auto ${className}`}
    >
      {segments.map((segment) => {
        const active = segment.id === value;
        const Icon = segment.icon;
        return (
          <button
            key={segment.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(segment.id)}
            className={`mac-segment whitespace-nowrap ${active ? "mac-segment-active" : "hover:text-gray-900 dark:hover:text-white"}`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
