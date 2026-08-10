import React from "react";
import { useAIChat } from "../../contexts/AIChatContext";
import { FiZap } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

export const AIChatButton: React.FC = () => {
  const { isOpen, setIsOpen, messages } = useAIChat();
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  if (isOpen) return null;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none"
      aria-label={t("ai.openChat", "Open AI Assistant")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="relative">
        <FiZap className="w-5 h-5 animate-pulse" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white"></span>
        )}
      </div>
      <span className="font-semibold text-sm hidden md:inline">
        {t("ai.buttonLabel", "MTDRB AI")}
      </span>
    </button>
  );
};
