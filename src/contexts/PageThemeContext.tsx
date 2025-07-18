import React, { createContext, useContext, useState, ReactNode } from 'react';
import { usePageTheme } from '../hooks/usePageTheme';

interface PageThemeContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  theme: ReturnType<typeof usePageTheme>;
}

const PageThemeContext = createContext<PageThemeContextType | undefined>(undefined);

interface PageThemeProviderProps {
  children: ReactNode;
  initialPage?: string;
}

/**
 * Provider component for page-specific theming
 * Manages the current page theme and provides theme utilities to child components
 */
export const PageThemeProvider: React.FC<PageThemeProviderProps> = ({ 
  children, 
  initialPage = 'dashboard' 
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const theme = usePageTheme(currentPage);

  const value: PageThemeContextType = {
    currentPage,
    setCurrentPage,
    theme
  };

  return (
    <PageThemeContext.Provider value={value}>
      {children}
    </PageThemeContext.Provider>
  );
};

/**
 * Hook to use the page theme context
 * @returns The current page theme context
 */
export const usePageThemeContext = () => {
  const context = useContext(PageThemeContext);
  if (context === undefined) {
    throw new Error('usePageThemeContext must be used within a PageThemeProvider');
  }
  return context;
};

/**
 * Hook to get theme utilities for a specific page
 * @param pageName - The name of the page to get theme for
 * @returns Theme utilities for the specified page
 */
export const usePageThemeFor = (pageName: string) => {
  return usePageTheme(pageName);
};

export default PageThemeProvider; 