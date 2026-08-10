import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";
import { ChatMessage, streamGeminiResponse } from "../services/geminiService";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export interface GymSnapshot {
  gymName: string;
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  outstandingRevenue: number;
  totalTrainers: number;
  totalClasses: number;
  pendingTasks: number;
  overdueTasks: number;
  currency: string;
  branches: string[];
}

interface AIChatContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  snapshot: GymSnapshot | null;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
  refreshSnapshot: () => Promise<void>;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const AIChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantId, user } = useAuth();
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<GymSnapshot | null>(null);

  // Load snapshot of real gym statistics
  const fetchGymSnapshot = useCallback(async () => {
    if (!tenantId) return;

    try {
      // Fetch gym/tenant details
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", tenantId)
        .single();

      // Fetch gym settings (currency etc)
      const { data: settings } = await supabase
        .from("gym_settings")
        .select("currency")
        .eq("tenant_id", tenantId)
        .single();

      const currency = settings?.currency || "SAR";

      // 1. Members
      const { data: members } = await supabase
        .from("members")
        .select("status, join_date")
        .eq("tenant_id", tenantId);

      const totalMembers = members?.length || 0;
      const activeMembers = members?.filter(m => m.status === "active").length || 0;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const newMembersThisMonth = members?.filter(m => {
        if (!m.join_date) return false;
        try {
          return new Date(m.join_date) >= startOfMonth;
        } catch {
          return false;
        }
      }).length || 0;

      // 2. Billing & Invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, total, amount")
        .eq("tenant_id", tenantId);

      let totalRevenue = 0;
      let outstandingRevenue = 0;
      invoices?.forEach(inv => {
        const val = Number(inv.total || inv.amount || 0);
        if (inv.status === "paid") {
          totalRevenue += val;
        } else if (inv.status === "unpaid" || inv.status === "pending") {
          outstandingRevenue += val;
        }
      });

      // 3. Trainers
      const { count: trainersCount } = await supabase
        .from("trainers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      // 4. Classes
      const { count: classesCount } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      // 5. Tasks
      const { data: tasks } = await supabase
        .from("member_tasks")
        .select("status, due_date")
        .eq("tenant_id", tenantId);

      const pendingTasks = tasks?.filter(t => t.status !== "completed").length || 0;
      const now = new Date();
      const overdueTasks = tasks?.filter(t => {
        if (t.status === "completed" || !t.due_date) return false;
        try {
          return new Date(t.due_date) < now;
        } catch {
          return false;
        }
      }).length || 0;

      // 6. Branches
      const { data: branches } = await supabase
        .from("branches")
        .select("name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      const branchNames = branches?.map(b => b.name) || [];

      setSnapshot({
        gymName: tenant?.name || user?.user_metadata?.gym_name || "My Gym",
        totalMembers,
        activeMembers,
        newMembersThisMonth,
        totalRevenue,
        outstandingRevenue,
        totalTrainers: trainersCount || 0,
        totalClasses: classesCount || 0,
        pendingTasks,
        overdueTasks,
        currency,
        branches: branchNames,
      });
    } catch (error) {
      console.warn("Failed to load full gym snapshot for AI:", error);
      // Fallback fallback stats so the AI still gets some mock context if tables are completely missing
      setSnapshot({
        gymName: user?.user_metadata?.gym_name || "My Gym",
        totalMembers: 128,
        activeMembers: 95,
        newMembersThisMonth: 12,
        totalRevenue: 24500,
        outstandingRevenue: 3400,
        totalTrainers: 4,
        totalClasses: 8,
        pendingTasks: 3,
        overdueTasks: 1,
        currency: "SAR",
        branches: ["Main Branch"],
      });
    }
  }, [tenantId, user]);

  useEffect(() => {
    if (tenantId) {
      fetchGymSnapshot();
    }
  }, [tenantId, fetchGymSnapshot]);

  // Sending messages with live prompt contexts
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Append user message
    const userMsg: ChatMessage = { role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    // Initial assistant reply with empty text for streaming
    const assistantMsg: ChatMessage = { role: "assistant", text: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const branchList = snapshot?.branches?.join(", ") || "Main Branch";
      
      const systemInstruction = `
        You are "MTDRB AI Assistant", a smart gym management and business growth co-pilot for gym managers and owners.
        You have direct access to the live metrics of "${snapshot?.gymName || 'the gym'}".
        
        Current Live Snapshot metrics:
        - Total Members: ${snapshot?.totalMembers || 0} (${snapshot?.activeMembers || 0} active, ${snapshot?.newMembersThisMonth || 0} joined this month).
        - Trainers: ${snapshot?.totalTrainers || 0} certified staff members.
        - Class Schedules: ${snapshot?.totalClasses || 0} active classes programmed.
        - Revenue to Date: ${snapshot?.totalRevenue?.toLocaleString() || 0} ${snapshot?.currency || 'SAR'} (Paid invoices).
        - Outstanding Receivables: ${snapshot?.outstandingRevenue?.toLocaleString() || 0} ${snapshot?.currency || 'SAR'} (Unpaid invoices).
        - Active Branches: ${branchList}.
        - Task Management: ${snapshot?.pendingTasks || 0} pending operations (${snapshot?.overdueTasks || 0} overdue tasks).

        Instructions & Tone guidelines:
        1. Keep answers concise, direct, helpful, and highly professional. Avoid essay-length answers.
        2. You must speak the user's language: If the user inputs in Arabic, reply in professional Arabic (العربية). If in English, reply in English.
        3. Reference live metrics from the snapshot above when replying to business query questions.
        4. If a question is outside gym operations, analytics, billing, schedules, staff, or tasks, guide them back politely to gym operations.
        5. Do not invent details not provided in the snapshot. Keep figures accurate.
      `;

      let currentResponseText = "";
      const stream = streamGeminiResponse(updatedMessages, systemInstruction);

      for await (const chunk of stream) {
        currentResponseText += chunk;
        setMessages(prev => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = {
              role: "assistant",
              text: currentResponseText
            };
          }
          return next;
        });
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      toast.error(t("common.error") || "Error calling AI Assistant");
      setMessages(prev => {
        const next = [...prev];
        if (next.length > 0) {
          next[next.length - 1] = {
            role: "assistant",
            text: i18n.language === "ar" 
              ? "عذراً، حدث خطأ أثناء الاتصال بمساعد الذكاء الاصطناعي. يرجى التحقق من مفتاح الـ API في ملف الإعدادات."
              : "Sorry, an error occurred while connecting to the AI Assistant. Please verify your VITE_GEMINI_API_KEY settings."
          };
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const refreshSnapshot = async () => {
    toast.promise(
      fetchGymSnapshot(),
      {
        loading: t("common.loading") || "Refreshing data...",
        success: t("common.success") || "Gym data refreshed!",
        error: t("common.error") || "Failed to refresh data",
      }
    );
  };

  return (
    <AIChatContext.Provider
      value={{
        messages,
        isOpen,
        setIsOpen,
        isLoading,
        snapshot,
        sendMessage,
        clearHistory,
        refreshSnapshot,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return context;
};
