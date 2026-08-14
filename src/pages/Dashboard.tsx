import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DashboardTabs } from "../components/dashboard/DashboardTabs";
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import { DashboardAnalytics } from "../components/dashboard/DashboardAnalytics";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useRTL } from "../hooks/useRTL";
import toast from "react-hot-toast";

const Dashboard: React.FC = () => {
  usePageThemeContext();
  const { isRTL } = useRTL();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const notificationShownRef = useRef(false);

  // Show welcome message if coming from onboarding (only once)
  useEffect(() => {
    if (location.state?.message && !notificationShownRef.current) {
      notificationShownRef.current = true;
      toast.success(location.state.message, {
        duration: 5000,
        icon: '🎉',
      });
      // Clear the state to prevent showing again on re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleRefresh = () => {
    setRefreshKey(Date.now());
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview refreshKey={refreshKey} />;
      case "analytics":
        return <DashboardAnalytics refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <DashboardHeader onRefresh={handleRefresh} />
      
      <DashboardTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
