import React from 'react';

interface TablePageLayoutProps {
  title: string;
  description?: string;
  summaryCards?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function TablePageLayout({
  title,
  description,
  summaryCards,
  actions,
  children,
}: TablePageLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-white via-blue-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 font-sans antialiased text-blue-900 dark:text-blue-100" style={{ fontFamily: 'Inter, SF Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
      <main className="flex-1 p-8 bg-transparent min-h-[calc(100vh-80px)]">
        <div className="max-w-6xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 dark:shadow-lg" style={{ borderRadius: 12, boxShadow: '0 4px 24px 0 rgba(21,95,217,0.06)' }}>
          {/* Header Row: Title, Description, Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-blue-900 dark:text-blue-100 mb-1 tracking-tight" style={{ fontWeight: 500 }}>{title}</h1>
              {description && <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl" style={{ fontWeight: 400 }}>{description}</p>}
            </div>
            {actions && <div className="flex gap-3">{actions}</div>}
          </div>
          {/* KPI Cards */}
          {summaryCards && <div className="flex gap-4 mb-6">{summaryCards}</div>}
          {/* Table (with its own search/filters) */}
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
} 