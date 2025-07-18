import { useMemo } from 'react';
import { getPageTheme, getThemeClasses, pageThemes } from '../theme';

/**
 * Custom hook for accessing page-specific theme colors and classes
 * @param pageName - The name of the current page
 * @returns Object containing theme colors, classes, and utility functions
 */
export const usePageTheme = (pageName: string) => {
  const theme = useMemo(() => getPageTheme(pageName), [pageName]);
  const classes = useMemo(() => getThemeClasses(pageName), [pageName]);

  const getColor = (shade: keyof typeof theme.primary = '500') => {
    return theme.primary[shade];
  };

  const getGradient = (direction: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-tr' | 'to-tl' | 'to-br' | 'to-bl' = 'to-r') => {
    return `bg-gradient-${direction} ${theme.gradient}`;
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    const baseClasses = 'rounded-full px-6 py-3 font-medium transition-all duration-300 flex items-center justify-center space-x-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} ${theme.button} text-white shadow-sm hover:shadow-md`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200`;
      case 'outline':
        return `${baseClasses} border-2 ${theme.button.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-')} bg-transparent text-${theme.accent.replace('#', '')}`;
      default:
        return `${baseClasses} ${theme.button} text-white shadow-sm hover:shadow-md`;
    }
  };

  const getCardClasses = (variant: 'default' | 'accent' | 'hover' = 'default') => {
    const baseClasses = 'rounded-2xl p-6 bg-white dark:bg-gray-800 border transition-all duration-300';
    
    switch (variant) {
      case 'default':
        return `${baseClasses} border-gray-100 dark:border-gray-700`;
      case 'accent':
        return `${baseClasses} ${theme.card}`;
      case 'hover':
        return `${baseClasses} ${theme.card} hover:shadow-md hover:scale-[1.02] cursor-pointer`;
      default:
        return `${baseClasses} border-gray-100 dark:border-gray-700`;
    }
  };

  const getBadgeClasses = (variant: 'default' | 'success' | 'warning' | 'error' = 'default') => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium';
    
    switch (variant) {
      case 'default':
        return `${baseClasses} ${theme.badge}`;
      case 'success':
        return `${baseClasses} bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200`;
      case 'warning':
        return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      default:
        return `${baseClasses} ${theme.badge}`;
    }
  };

  const getTabClasses = (isActive: boolean = false) => {
    const baseClasses = 'px-4 py-3 text-sm font-medium border-b-2 border-transparent transition-all duration-300';
    
    if (isActive) {
      return `${baseClasses} ${theme.tab}`;
    }
    
    return `${baseClasses} text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600`;
  };

  const getIconClasses = (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    };
    
    return `${sizeClasses[size]} ${theme.icon}`;
  };

  const getStatusClasses = (status: 'active' | 'inactive' | 'pending' | 'completed' | 'error') => {
    const statusMap = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    return `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusMap[status]}`;
  };

  return {
    // Theme data
    theme,
    classes,
    
    // Color utilities
    getColor,
    getGradient,
    
    // Component classes
    getButtonClasses,
    getCardClasses,
    getBadgeClasses,
    getTabClasses,
    getIconClasses,
    getStatusClasses,
    
    // Direct access to theme properties
    primary: theme.accent,
    gradient: theme.gradient,
    icon: theme.icon,
    button: theme.button,
    card: theme.card,
    badge: theme.badge,
    tab: theme.tab,
    
    // Page information
    pageName: theme.name,
    pageDescription: theme.description,
    
    // Available themes
    availableThemes: Object.keys(pageThemes)
  };
};

export default usePageTheme; 