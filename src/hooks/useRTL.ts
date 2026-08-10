import { useTranslation } from "react-i18next";

/**
 * Custom hook to detect RTL (Right-to-Left) language support
 * @returns Object with isRTL boolean and direction string
 */
export function useRTL() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const direction = isRTL ? "rtl" : "ltr";

  return {
    isRTL,
    direction,
    language: i18n.language,
  };
}
