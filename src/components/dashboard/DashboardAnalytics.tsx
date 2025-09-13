import React from "react";
import { motion } from "framer-motion";
import SmartDashboardAnalytics from "./SmartDashboardAnalytics";

interface DashboardAnalyticsProps {
  refreshKey: number;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ 
  refreshKey 
}) => {
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SmartDashboardAnalytics refreshKey={refreshKey} />
    </motion.div>
  );
}; 