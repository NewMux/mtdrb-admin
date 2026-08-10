import React, { useState, useRef, useEffect } from "react";
import { useAIChat } from "../../contexts/AIChatContext";
import { useRTL } from "../../hooks/useRTL";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiX, FiZap, FiRefreshCw, FiTrash2, FiCopy, FiCheck } from "react-icons/fi";

export const AIChatPanel: React.FC = () => {
  const { messages, isOpen, setIsOpen, isLoading, sendMessage, clearHistory, refreshSnapshot } = useAIChat();
  const { isRTL } = useRTL();
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isArabic = i18n.language === "ar";

  const suggestions = isArabic
    ? [
        { label: "كم عدد الأعضاء النشطين؟", prompt: "كم عدد الأعضاء النشطين في النادي حالياً؟" },
        { label: "ما هي قيمة الاشتراكات المستحقة؟", prompt: "ما هي قيمة الفواتير المستحقة والاشتراكات غير المدفوعة؟" },
        { label: "عرض إحصائيات المهام المتأخرة", prompt: "هل لدينا أي مهام متأخرة أو معلقة؟ عرضها لي." },
        { label: "ملخص أداء النادي اليوم", prompt: "اعطني ملخصاً سريعاً لأداء النادي والاشتراكات والمبيعات اليوم." }
      ]
    : [
        { label: "How many active members?", prompt: "How many active members do we currently have?" },
        { label: "What is the outstanding revenue?", prompt: "What is the total value of outstanding or unpaid invoices?" },
        { label: "Show overdue tasks", prompt: "Show me a breakdown of pending and overdue tasks." },
        { label: "Summary of gym performance", prompt: "Give me a quick summary of the gym's active classes, members, and revenue." }
      ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Sliding Panel */}
          <motion.div
            className={`fixed top-0 bottom-0 ${
              isRTL ? "left-0" : "right-0"
            } w-full sm:w-[450px] bg-white dark:bg-gray-900 border-l border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl transition-colors duration-200`}
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-850">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <FiZap className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {t("ai.assistant", "MTDRB AI Assistant")}
                  </h3>
                  <p className="text-xs text-green-500 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    {t("ai.connected", "Live Context Enabled")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={refreshSnapshot}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={t("ai.refreshData", "Refresh Gym Data")}
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={clearHistory}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={t("ai.clearHistory", "Clear Conversation")}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                    <FiZap className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                      {isArabic ? "مرحباً بك في مساعد الإدارة الذكي" : "Welcome to your Business Co-pilot"}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                      {isArabic
                        ? "اطرح أي سؤال حول الاشتراكات، الأعضاء، الجداول، الفواتير أو المهام اليومية في النادي."
                        : "Ask me anything about class schedules, active membership counts, billing performance, or outstanding tasks."}
                    </p>
                  </div>

                  {/* Suggestions Grid */}
                  <div className="w-full space-y-2 mt-4 max-w-md">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(s.prompt)}
                        className="w-full text-right p-3.5 bg-white dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-all shadow-sm hover:shadow-md cursor-pointer block"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={index}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group transition-all duration-200 ${
                            isUser
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-white dark:bg-gray-850 text-gray-850 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-bl-none"
                          }`}
                        >
                          {/* Copy Button */}
                          {!isUser && msg.text && (
                            <button
                              onClick={() => handleCopy(msg.text, index)}
                              className={`absolute -top-3 ${
                                isRTL ? "-left-2" : "-right-2"
                              } p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 dark:border-gray-700`}
                              title={t("common.copy", "Copy text")}
                            >
                              {copiedId === index ? (
                                <FiCheck className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <FiCopy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          <div className="text-sm leading-relaxed whitespace-pre-line font-normal">
                            {msg.text || (
                              <span className="flex space-x-1.5 items-center justify-start py-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse delay-75"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse delay-150"></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center space-x-2 space-x-reverse">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                placeholder={
                  isArabic
                    ? "اسأل مساعد الذكاء الاصطناعي..."
                    : "Ask MTDRB Assistant anything..."
                }
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]"
              >
                <FiSend className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
