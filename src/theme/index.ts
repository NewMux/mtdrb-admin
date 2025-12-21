import { createTheme } from "@mui/material/styles";

export const colors = {
  primary: {
    main: "#155FD9",
    light: "#489BFA",
    dark: "#0D1F85",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#7BBDFE",
    light: "#A9D2FE",
    dark: "#489BFA",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#DC2626",
    light: "#EF4444",
    dark: "#B91C1C",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#F59E0B",
    light: "#FBBF24",
    dark: "#D97706",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#3B82F6",
    light: "#60A5FA",
    dark: "#2563EB",
    contrastText: "#FFFFFF",
  },
  success: {
    main: "#10B981",
    light: "#34D399",
    dark: "#059669",
    contrastText: "#FFFFFF",
  },
  grey: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
};

// Page-specific color themes
export const pageThemes = {
  dashboard: {
    name: "Dashboard",
    description: "Overview and key metrics",
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    accent: "#0ea5e9", // Sky blue
    gradient: "from-sky-400 to-blue-500",
    icon: "text-sky-600",
    button: "bg-sky-500 hover:bg-sky-600",
    card: "border-sky-200 bg-sky-50/30",
    badge: "bg-sky-100 text-sky-800",
    tab: "text-sky-600 border-sky-600",
  },

  members: {
    name: "Members",
    description: "Member management and profiles",
    primary: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
    },
    accent: "#10b981", // Emerald green
    gradient: "from-emerald-400 to-green-500",
    icon: "text-emerald-600",
    button: "bg-emerald-500 hover:bg-emerald-600",
    card: "border-emerald-200 bg-emerald-50/30",
    badge: "bg-emerald-100 text-emerald-800",
    tab: "text-emerald-600 border-emerald-600",
  },

  classes: {
    name: "Classes",
    description: "Class scheduling and management",
    primary: {
      50: "#fef3c7",
      100: "#fde68a",
      200: "#fcd34d",
      300: "#fbbf24",
      400: "#f59e0b",
      500: "#d97706",
      600: "#b45309",
      700: "#92400e",
      800: "#78350f",
      900: "#451a03",
    },
    accent: "#f59e0b", // Amber orange
    gradient: "from-amber-400 to-orange-500",
    icon: "text-amber-600",
    button: "bg-amber-500 hover:bg-amber-600",
    card: "border-amber-200 bg-amber-50/30",
    badge: "bg-amber-100 text-amber-800",
    tab: "text-amber-600 border-amber-600",
  },

  trainers: {
    name: "Trainers",
    description: "Trainer management and performance",
    primary: {
      50: "#fdf4ff",
      100: "#fae8ff",
      200: "#f5d0fe",
      300: "#f0abfc",
      400: "#e879f9",
      500: "#d946ef",
      600: "#c026d3",
      700: "#a21caf",
      800: "#86198f",
      900: "#701a75",
    },
    accent: "#d946ef", // Fuchsia pink
    gradient: "from-fuchsia-400 to-pink-500",
    icon: "text-fuchsia-600",
    button: "bg-fuchsia-500 hover:bg-fuchsia-600",
    card: "border-fuchsia-200 bg-fuchsia-50/30",
    badge: "bg-fuchsia-100 text-fuchsia-800",
    tab: "text-fuchsia-600 border-fuchsia-600",
  },

  billing: {
    name: "Billing",
    description: "Financial management and invoicing",
    primary: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    accent: "#22c55e", // Green
    gradient: "from-green-400 to-emerald-500",
    icon: "text-green-600",
    button: "bg-green-500 hover:bg-green-600",
    card: "border-green-200 bg-green-50/30",
    badge: "bg-green-100 text-green-800",
    tab: "text-green-600 border-green-600",
  },

  analytics: {
    name: "Analytics",
    description: "Data insights and reporting",
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    accent: "#3b82f6", // Blue
    gradient: "from-blue-400 to-indigo-500",
    icon: "text-blue-600",
    button: "bg-blue-500 hover:bg-blue-600",
    card: "border-blue-200 bg-blue-50/30",
    badge: "bg-blue-100 text-blue-800",
    tab: "text-blue-600 border-blue-600",
  },

  promotions: {
    name: "Promotions",
    description: "Marketing campaigns and offers",
    primary: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7c3aed",
      800: "#6b21a8",
      900: "#581c87",
    },
    accent: "#a855f7", // Purple
    gradient: "from-purple-400 to-violet-500",
    icon: "text-purple-600",
    button: "bg-purple-500 hover:bg-purple-600",
    card: "border-purple-200 bg-purple-50/30",
    badge: "bg-purple-100 text-purple-800",
    tab: "text-purple-600 border-purple-600",
  },

  reports: {
    name: "Reports",
    description: "Data reports and insights",
    primary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    accent: "#64748b", // Slate gray
    gradient: "from-slate-400 to-gray-500",
    icon: "text-slate-600",
    button: "bg-slate-500 hover:bg-slate-600",
    card: "border-slate-200 bg-slate-50/30",
    badge: "bg-slate-100 text-slate-800",
    tab: "text-slate-600 border-slate-600",
  },

  tasks: {
    name: "Tasks",
    description: "Task management and automation",
    primary: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
    },
    accent: "#f97316", // Orange
    gradient: "from-orange-400 to-red-500",
    icon: "text-orange-600",
    button: "bg-orange-500 hover:bg-orange-600",
    card: "border-orange-200 bg-orange-50/30",
    badge: "bg-orange-100 text-orange-800",
    tab: "text-orange-600 border-orange-600",
  },

  settings: {
    name: "Settings",
    description: "System configuration and preferences",
    primary: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
    accent: "#6b7280", // Gray
    gradient: "from-gray-400 to-slate-500",
    icon: "text-gray-600",
    button: "bg-gray-500 hover:bg-gray-600",
    card: "border-gray-200 bg-gray-50/30",
    badge: "bg-gray-100 text-gray-800",
    tab: "text-gray-600 border-gray-600",
  },

  insights: {
    name: "Insights",
    description: "Smart-powered insights and recommendations",
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    accent: "#0ea5e9", // Sky blue
    gradient: "from-sky-400 to-cyan-500",
    icon: "text-sky-600",
    button: "bg-sky-500 hover:bg-sky-600",
    card: "border-sky-200 bg-sky-50/30",
    badge: "bg-sky-100 text-sky-800",
    tab: "text-sky-600 border-sky-600",
  },
};

// Helper function to get page theme
export const getPageTheme = (pageName: string) => {
  const theme = pageThemes[pageName as keyof typeof pageThemes];
  if (!theme) {
    console.warn(`No theme found for page: ${pageName}, using dashboard theme`);
    return pageThemes.dashboard;
  }
  return theme;
};

// Helper function to get theme colors as Tailwind classes
export const getThemeClasses = (pageName: string) => {
  const theme = getPageTheme(pageName);
  return {
    primary: theme.accent,
    gradient: `bg-gradient-to-r ${theme.gradient}`,
    icon: theme.icon,
    button: theme.button,
    card: theme.card,
    badge: theme.badge,
    tab: theme.tab,
  };
};

export const theme = {
  colors: {
    // Background & Surface
    background: "#FAFAFA",
    surface: "#F2F2F5",
    surfaceHover: "#E8E8EB",

    // Text
    primary: "#1A1A1A",
    secondary: "#6B6B6B",
    tertiary: "#9CA3AF",

    // Accents
    sky: "#60A5FA",
    rose: "#F472B6",
    emerald: "#34D399",
    gold: "#FBBF24",

    // Semantic
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
    info: "#3B82F6",

    // Gradients
    gradient: "bg-gradient-to-tr from-sky-400 to-rose-400",
    gradientHover: "bg-gradient-to-tr from-sky-500 to-rose-500",
  },

  dark: {
    background: "#111827",
    surface: "#1F2937",
    surfaceHover: "#374151",
    primary: "#F9FAFB",
    secondary: "#D1D5DB",
    tertiary: "#9CA3AF",
  },

  spacing: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
  },

  borderRadius: {
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },

  typography: {
    fontFamily: {
      sans: ["Inter", "Cairo", "system-ui", "sans-serif"],
      arabic: ["Cairo", "Inter", "system-ui", "sans-serif"],
    },

    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },

    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  animation: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },

    easing: {
      ease: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    },
  },
};

export const designTokens = {
  // Card styles
  card: {
    base: "rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700",
    hover:
      "hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300",
    interactive: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
  },

  // Button styles
  button: {
    base: "rounded-full px-6 py-3 font-medium transition-all duration-300 flex items-center justify-center space-x-2",
    primary: "bg-sky-500 hover:bg-sky-600 text-white shadow-sm hover:shadow-md",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white",
    warning: "bg-gold-500 hover:bg-gold-600 text-white",
    error: "bg-red-500 hover:bg-red-600 text-white",
    ghost:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300",
  },

  // Form styles
  form: {
    input:
      "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300",
    select:
      "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300",
    textarea:
      "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300 resize-none",
    label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
  },

  // Table styles
  table: {
    container:
      "w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700",
    header:
      "bg-gray-50 dark:bg-gray-800 px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300",
    row: "border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200",
    cell: "px-6 py-4 text-sm text-gray-900 dark:text-white",
  },

  // Modal styles
  modal: {
    overlay: "fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40",
    container:
      "fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50",
    header:
      "sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4",
    content: "flex-1 overflow-y-auto px-6 py-4",
    footer:
      "sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4",
  },

  // Tab styles
  tab: {
    container: "border-b border-gray-200 dark:border-gray-700",
    button:
      "px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300",
    active: "text-sky-600 dark:text-sky-400 border-sky-600 dark:border-sky-400",
  },

  // Badge styles
  badge: {
    base: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
    primary: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
    success:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    warning: "bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

export default theme;

export const tailwindConfig = {
  button: {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 ease-in-out min-h-[44px] dark:bg-blue-500 dark:hover:bg-blue-400",
    secondary:
      "border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 ease-in-out min-h-[44px] dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 ease-in-out min-h-[44px] dark:bg-emerald-500",
    warning:
      "bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 ease-in-out min-h-[44px] dark:bg-orange-500",
    ghost:
      "text-gray-500 hover:text-gray-700 bg-transparent px-4 py-2 rounded-xl transition-all duration-300 ease-in-out min-h-[44px] dark:text-gray-400 dark:hover:text-white",
  },
  card: {
    base: "bg-white p-6 rounded-2xl shadow-sm gap-2 dark:bg-gray-800 dark:shadow-lg dark:border-gray-700",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    alert:
      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
    analytics:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
    revenue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    meta: "bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
    border: "border-l-4 dark:border-gray-700",
  },
  text: {
    title: "text-gray-900 font-semibold text-lg dark:text-white",
    body: "text-gray-700 text-base dark:text-gray-200",
    small: "text-gray-500 text-sm dark:text-gray-400",
  },
  border: "border-gray-200 dark:border-gray-700",
  transition: "transition-all duration-300 ease-in-out",
};
