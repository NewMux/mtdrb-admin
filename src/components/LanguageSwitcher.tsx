import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const langs = [
  { code: "en", label: "EN" },
  { code: "ar", label: "العربية" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const current = i18n.language;
  const isRTL = current === "ar";

  React.useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate();
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const setLang = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      // Direction is automatically set by i18n listener, but set it here as well for immediate update
      document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = code;
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Reverse the array order for RTL so Arabic appears first
  const orderedLangs = isRTL ? [...langs].reverse() : langs;

  return (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-full flex-shrink-0 shadow-sm border border-gray-200 dark:border-gray-700">
      {orderedLangs.map((lang) => {
        const isActive = current === lang.code;
        return (
          <motion.button
            key={lang.code}
            onClick={() => setLang(lang.code)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative px-4 py-2 rounded-full text-sm font-semibold 
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
              whitespace-nowrap min-w-[44px] flex items-center justify-center
              ${
                isActive
                  ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                  : "bg-transparent text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }
            `}
          >
            {lang.label}
          </motion.button>
        );
      })}
    </div>
  );
}
