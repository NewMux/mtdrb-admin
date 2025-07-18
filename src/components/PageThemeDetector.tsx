import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageThemeContext } from '../contexts/PageThemeContext';

/**
 * Component that automatically detects the current page from the URL
 * and sets the appropriate theme in the PageThemeContext
 */
const PageThemeDetector: React.FC = () => {
  const location = useLocation();
  const { setCurrentPage } = usePageThemeContext();

  useEffect(() => {
    const pathname = location.pathname;
    
    // Extract page name from URL path
    let pageName = 'dashboard'; // default
    
    if (pathname.includes('/members')) {
      pageName = 'members';
    } else if (pathname.includes('/classes')) {
      pageName = 'classes';
    } else if (pathname.includes('/trainers')) {
      pageName = 'trainers';
    } else if (pathname.includes('/billing')) {
      pageName = 'billing';
    } else if (pathname.includes('/analytics')) {
      pageName = 'analytics';
    } else if (pathname.includes('/promotions')) {
      pageName = 'promotions';
    } else if (pathname.includes('/reports')) {
      pageName = 'reports';
    } else if (pathname.includes('/tasks')) {
      pageName = 'tasks';
    } else if (pathname.includes('/settings')) {
      pageName = 'settings';
    } else if (pathname.includes('/insights')) {
      pageName = 'insights';
    } else if (pathname.includes('/dashboard') || pathname === '/') {
      pageName = 'dashboard';
    }
    
    // Update the current page theme
    setCurrentPage(pageName);
    
    // Log theme change for debugging
    console.log(`🎨 Page theme changed to: ${pageName}`);
  }, [location.pathname, setCurrentPage]);

  // This component doesn't render anything
  return null;
};

export default PageThemeDetector; 