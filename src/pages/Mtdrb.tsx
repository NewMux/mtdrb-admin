import React, { useState } from "react";
import { FiBookOpen, FiSearch, FiMessageCircle } from "react-icons/fi";

const PROJECT_KB = [
  {
    title: "Recent Updates",
    content: [
      "• All major forms (Add Member, Member Profile, Class Form) now use a modern drawer-style UI with smooth slide-in animation.",
      "• Membership plans and trainers are fetched live from the backend (no more hardcoded lists).",
      "• End date for memberships is auto-calculated based on the selected plan duration.",
      "• Add Member flow is robust: all fields are validated, backend-integrated, and invoices can be auto-generated.",
      "• Global UIContext tracks when any drawer/modal is open, enabling smart repositioning of the MTDRB Assistant button.",
      "• Responsive bottom padding ensures action buttons are never hidden behind the Assistant widget, but avoids excessive empty space.",
      "• All drawers and modals have consistent, beautiful Apple-style UX.",
      "• Fixed all React hook order issues for robust, error-free rendering.",
      "• Knowledge base is always up to date with the latest features and best practices.",
    ].join("\n"),
  },
  {
    title: "Project Overview",
    content:
      "MTDRB Admin is a modern web admin dashboard for gym/fitness business management. Built with React, Supabase, Tailwind, and more. Key features include memberships, classes, billing, trainers, analytics, and multi-tenant support.",
  },
  {
    title: "Latest Features & UX Improvements",
    content: [
      "• Modern Classes list/table: search, advanced filters (date, capacity, price), pagination, and CSV/PDF export.",
      "• Apple-style KPI cards for classes, always up-to-date.",
      "• Modern delete confirmation modal with animation.",
      "• Color tag picker uses simple color swatches (no color picker).",
      "• Consistent navigation and actions across Members and Classes.",
      "• MTDRB Assistant: Floating chat bot widget for insights, reporting, and suggestions (Chat integration ready).",
    ].join("\n"),
  },
  {
    title: "Directory Structure",
    content:
      "src/: All frontend code. supabase/: All database migrations and SQL. components/: UI components by feature. pages/: Top-level route pages. types/: TypeScript types. utils/: Utility functions.",
  },
  {
    title: "Key Features",
    content:
      "Memberships, Classes, Billing, Trainers, Reports, Tasks, Notifications. Each feature has its own page, components, and database tables.",
  },
  {
    title: "UI/UX Patterns",
    content:
      "Apple-style, modern, desktop-first. Drawers for add/edit/view. KPI cards at the top. Tables/lists with search, filter, and actions. Responsive and beautiful.",
  },
  {
    title: "Database",
    content:
      "Supabase/Postgres with migrations, triggers, RLS policies. All data is multi-tenant aware.",
  },
  {
    title: "Extensibility",
    content:
      "Easy to add new features, tables, analytics. Component-based UI. All business logic in migrations/functions.",
  },
  {
    title: "Smart Features & Automation",
    content: [
      "• MTDRB Assistant: Floating chat bot widget, always accessible.",
      "• Ready for chat integration for insights, reporting, and suggestions.",
      '• Context-aware features planned (e.g., "Ask about this page").',
    ].join("\n"),
  },
  {
    title: "Apple-Style Modal System & New Invoice Modal",
    content: [
      "• All modals use the AppleStyleModal component for a consistent, modern Apple-like look (frosted glass, rounded corners, soft shadow, smooth animation).",
      "• Modal content should NOT add extra backgrounds, borders, or rounded corners—let the modal provide these.",
      "• The main content area inside the modal uses overflow-y-auto and max-h-[70vh] for smooth scrolling if content is long.",
      "• Use space-y-* utilities for vertical spacing between sections.",
      "• Action buttons are placed in a sticky or fixed footer for long modals.",
      "• The New Invoice modal now matches the Apple-style look and is fully scrollable, with all UI/UX best practices applied.",
      "• If a modal does not open or look correct, check for import/export mismatches, extra backgrounds, or missing scrollability.",
    ].join("\n"),
  },
  {
    title:
      "Session Summary: Apple-Style Modals, Billing, and Debugging (June 2024)",
    content: [
      "• Refactored all billing modals (Add Expense, Add Subscription, New Invoice) to use the AppleStyleModal for a consistent, modern UI/UX.",
      "• Ensured all modal content avoids extra backgrounds, borders, or rounded corners—these are provided by the modal itself.",
      "• Made all modals scrollable with overflow-y-auto and max-h-[70vh] for long content.",
      "• Fixed import/export issues (named vs. default exports) that can break modal rendering.",
      "• Debugged and resolved issues with the New Invoice modal not opening or not matching the Apple-style look.",
      "• Added debugging tips: always check for import mismatches, extra backgrounds, and scrollability if a modal is broken.",
      "• Updated the knowledge base with best practices for modals and billing UI.",
      "• All fixes and improvements are now documented for future contributors.",
    ].join("\n"),
  },
  {
    title:
      "Comprehensive Session Documentation: Apple-Style Modals, Billing, and UI/UX (June 2024)",
    content: [
      "---",
      "Apple-Style Modal System:",
      "• All modals use the AppleStyleModal component for a consistent, modern Apple-like look (frosted glass, rounded corners, soft shadow, smooth animation).",
      "• Modal content should NOT add extra backgrounds, borders, or rounded corners—these are provided by the modal itself.",
      "• Use overflow-y-auto and max-h-[70vh] on the main content area for scrollability.",
      "• Use space-y-* utilities for vertical spacing between sections.",
      "• Action buttons are placed in a sticky or fixed footer for long modals.",
      "• If a modal does not open or look correct, check for import/export mismatches, extra backgrounds, or missing scrollability.",
      "",
      "Billing Modals Refactor:",
      "• Add Expense, Add Subscription, and New Invoice modals all use AppleStyleModal for UI consistency.",
      "• All form state and validation is aligned with backend types.",
      "• Removed non-existent fields and ensured correct property mapping.",
      "• All modals are now scrollable and match the Apple-style look.",
      "",
      "Debugging & Troubleshooting:",
      "• Always use named imports for components with named exports (e.g., import { NewInvoiceModal } from ...).",
      '• If you see "does not provide an export named default", check all imports and restart the dev server.',
      "• Use console.log debugging to trace state and prop flow.",
      "• Restart Vite dev server to clear HMR cache if UI is stuck.",
      "",
      "UI/UX Best Practices:",
      "• Use Apple-style components (AppleInput, AppleSelect, AppleButton, etc.) for all forms and modals.",
      "• Place action buttons in a sticky or fixed footer for long modals.",
      "• Ensure all modals and drawers are responsive and accessible.",
      "",
      "TypeScript & Data Model Alignment:",
      "• Keep all TypeScript types in sync with backend models.",
      "• Avoid property mismatches and always check for missing/extra fields.",
      "",
      "Knowledge Base & Documentation:",
      "• All best practices, lessons, and session summaries are documented in src/pages/Mtdrb.tsx.",
      "• Update this file after every major UI/UX or workflow improvement.",
      "• Use this knowledge base for onboarding and as a reference for future work.",
      "---",
    ].join("\n"),
  },
];

export default function Mtdrb() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = () => {
    // Placeholder: In production, this would call the assistant backend
    setAnswer(
      "Smart Assistant: This is a placeholder answer. In production, I would answer your question about the MTDRB project using my knowledge base.",
    );
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <FiBookOpen className="text-blue-500 text-3xl" />
          <h1 className="text-2xl font-bold text-blue-900">
            MTDRB Project Knowledge Base & Smart Assistant
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {PROJECT_KB.map((item, idx) => (
            <div
              key={idx}
              className="bg-blue-50 rounded-xl p-4 border border-blue-100"
            >
              <div className="font-semibold text-blue-700 mb-1">
                {item.title}
              </div>
              <div className="text-blue-900 text-sm">{item.content}</div>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <FiMessageCircle className="text-blue-400" />
            <span className="font-semibold text-blue-700">
              Ask the Smart Assistant
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded-lg border border-blue-200 outline-none"
              placeholder="Ask a question about the project..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAsk();
              }}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ease-in-out min-h-[44px]"
              onClick={handleAsk}
            >
              <FiSearch />
            </button>
          </div>
          {answer && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-blue-100 text-blue-900">
              {answer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
