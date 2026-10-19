import React from "react";

interface BrandMarkProps {
  className?: string;
  /** Show the "Powered by NewMux" line next to the wordmark. */
  poweredBy?: boolean;
  /** Color classes for the "Powered by" line. */
  poweredByClassName?: string;
}

/**
 * The MTDRB wordmark set in the system font with a solid fill, so it
 * follows the surrounding text color (and dark mode) instead of baking in
 * a gradient like public/mtdrb-logo.svg.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  className = "",
  poweredBy = false,
  poweredByClassName = "text-gray-500 dark:text-gray-400",
}) => (
  <span className={`inline-flex items-baseline gap-2 ${className}`} dir="ltr">
    <span className="font-apple font-bold tracking-tight">MTDRB</span>
    {poweredBy && (
      <span className={`text-[0.7em] font-normal whitespace-nowrap ${poweredByClassName}`}>
        Powered by NewMux
      </span>
    )}
  </span>
);
