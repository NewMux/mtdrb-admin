/**
 * Apple-inspired Design System Constants
 * Centralized design tokens for consistent styling across the application
 */

export const DESIGN_TOKENS = {
  // Border radius
  borderRadius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  },

  // Borders
  borders: {
    subtle: 'border-gray-200/50',
    medium: 'border-gray-200',
    strong: 'border-gray-300',
  },

  // Spacing
  spacing: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  },

  // Colors
  colors: {
    primary: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200',
    },
    success: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
      hover: 'hover:bg-emerald-600',
      light: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    warning: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      hover: 'hover:bg-yellow-600',
      light: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
    danger: {
      bg: 'bg-red-500',
      text: 'text-red-600',
      hover: 'hover:bg-red-600',
      light: 'bg-red-50',
      border: 'border-red-200',
    },
    neutral: {
      bg: 'bg-gray-500',
      text: 'text-gray-600',
      hover: 'hover:bg-gray-600',
      light: 'bg-gray-50',
      border: 'border-gray-200',
    },
  },

  // Transitions
  transitions: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
  },

  // Typography
  typography: {
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-semibold tracking-tight',
    h3: 'text-xl font-semibold tracking-tight',
    h4: 'text-lg font-medium',
    body: 'text-base',
    small: 'text-sm',
    caption: 'text-xs',
  },
} as const;

/**
 * MTDRB Modal Style Specification
 * Slide-in modal from the right with clean design
 */
export const MODAL_STYLES = {
  // Container
  container: 'fixed inset-0 z-50 overflow-hidden',

  // Backdrop
  backdrop: 'fixed inset-0 bg-black/40 backdrop-blur-sm',

  // Modal Panel - Slide from right
  panel: {
    base: 'fixed right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl',
    slide: 'transform transition-transform duration-300 ease-in-out',
    slideIn: 'translate-x-0',
    slideOut: 'translate-x-full',
  },

  // Header
  header: {
    container: 'sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-6',
    title: 'text-xl font-semibold text-gray-900 dark:text-white tracking-tight',
    subtitle: 'text-sm text-gray-600 dark:text-gray-400 mt-1',
    closeButton: 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700',
  },

  // Content
  content: {
    container: 'flex-1 overflow-y-auto px-8 py-6',
    section: 'mb-8 last:mb-0',
    sectionTitle: 'text-lg font-semibold text-gray-900 dark:text-white mb-4',
    sectionSubtitle: 'text-sm text-gray-600 dark:text-gray-400 mb-4',
  },

  // Footer
  footer: {
    container: 'sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200/50 dark:border-gray-700/50 px-8 py-6',
    actions: 'flex items-center justify-end space-x-3',
  },

  // Form Sections
  form: {
    section: 'bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-6 mb-6',
    sectionTitle: 'text-base font-semibold text-gray-900 dark:text-white mb-4',
    sectionDescription: 'text-sm text-gray-600 dark:text-gray-400 mb-4',
    fieldGroup: 'space-y-4',
    field: 'space-y-2',
    label: 'block text-sm font-medium text-gray-700 dark:text-gray-300',
    input: 'w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
    select: 'w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
    textarea: 'w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
    error: 'text-sm text-red-600 dark:text-red-400',
    help: 'text-sm text-gray-500 dark:text-gray-400',
  },

  // Smart Form Components
  smartForm: {
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    fullWidth: 'col-span-1 md:col-span-2',
    inline: 'flex items-center space-x-4',
    checkbox: 'flex items-center space-x-2',
    radio: 'flex items-center space-x-2',
    toggle: 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
    toggleActive: 'bg-blue-500',
    toggleInactive: 'bg-gray-200 dark:bg-gray-600',
    toggleThumb: 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
    toggleThumbActive: 'translate-x-5',
    toggleThumbInactive: 'translate-x-1',
  },
} as const;

/**
 * Common component classes for Apple-inspired design
 */
export const COMPONENT_CLASSES = {
  // Cards
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50',
    hover: 'hover:shadow-xl transition-shadow duration-300',
    interactive: 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200',
  },

  // Buttons
  button: {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 rounded-xl px-4 py-2 transition-colors duration-200',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl px-4 py-2 transition-colors duration-200',
    ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl px-4 py-2 transition-colors duration-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 rounded-xl px-4 py-2 transition-colors duration-200',
  },

  // Modals (Updated to MTDRB specification)
  modal: {
    backdrop: 'fixed inset-0 bg-black/40 backdrop-blur-sm',
    content: 'fixed right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl',
    header: 'sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-6',
    body: 'flex-1 overflow-y-auto px-8 py-6',
    footer: 'sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200/50 dark:border-gray-700/50 px-8 py-6',
  },

  // Forms
  form: {
    input: 'w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
    select: 'w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
    textarea: 'w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
    label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
  },

  // Tables
  table: {
    container: 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden',
    header: 'bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200/50 dark:border-gray-700/50',
    row: 'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200',
    cell: 'px-6 py-4 text-sm',
  },

  // Navigation
  nav: {
    item: 'px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200',
    active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  },
} as const;

/**
 * Utility function to combine classes with Apple-inspired defaults
 */
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get design token with fallback
 */
export const getDesignToken = <T extends keyof typeof DESIGN_TOKENS>(
  category: T,
  variant: keyof typeof DESIGN_TOKENS[T]
): string => {
  return DESIGN_TOKENS[category][variant] as string;
};

/**
 * MTDRB Modal Animation Classes
 */
export const MODAL_ANIMATIONS = {
  slideIn: 'transform translate-x-0 transition-transform duration-300 ease-in-out',
  slideOut: 'transform translate-x-full transition-transform duration-300 ease-in-out',
  fadeIn: 'opacity-100 transition-opacity duration-300 ease-in-out',
  fadeOut: 'opacity-0 transition-opacity duration-300 ease-in-out',
} as const; 