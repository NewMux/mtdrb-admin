import React from "react";
import { useTranslation } from "react-i18next";

const langs = [
  { code: "en", label: "EN" },
  { code: "ar", label: "العربية" },
];

interface LanguageSwitcherProps {
  /** Render light-mode styling regardless of the app theme (marketing pages). */
  forceLight?: boolean;
}

export default function LanguageSwitcher({ forceLight = false }: LanguageSwitcherProps = {}) {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const isRTL = current === "ar";


  const setLang = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      // The i18n bootstrap owns document language and direction updates.
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Reverse the array order for RTL so Arabic appears first
  const orderedLangs = isRTL ? [...langs].reverse() : langs;

  return (
    <div
      className={
        forceLight
          ? "inline-flex items-center p-0.5 gap-0.5 rounded-lg bg-black/5 flex-shrink-0"
          : "mac-segmented flex-shrink-0"
      }
      role="group"
      aria-label="Language"
    >
      {orderedLangs.map((lang) => {
        const isActive = current === lang.code;
        return (
          <button
            type="button"
            key={lang.code}
            onClick={() => setLang(lang.code)}
            aria-label={`${lang.label} – ${lang.code === "ar" ? "العربية" : "English"}`}
            aria-pressed={isActive}
            className={
              forceLight
                ? `inline-flex items-center rounded-md px-2.5 py-0.5 text-xs whitespace-nowrap transition-colors ${
                    isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`
                : `mac-segment px-2.5 py-0.5 text-xs whitespace-nowrap ${
                    isActive ? "mac-segment-active" : "hover:text-gray-900 dark:hover:text-white"
                  }`
            }
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
