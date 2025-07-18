import React, { useState, useEffect } from 'react';
import { FiGift, FiPlus, FiSearch, FiFilter, FiPercent, FiDollarSign, FiCalendar, FiUsers, FiTrendingUp, FiBarChart, FiEdit, FiTrash2, FiEye, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { usePageThemeContext } from '../contexts/PageThemeContext';

// Promotion Components
import { PromoCodeDashboard } from "../components/promotions/PromoCodeDashboard";
import { PromoCodeBuilder } from "../components/promotions/PromoCodeBuilder";
import { PromoCodeAnalytics } from "../components/promotions/PromoCodeAnalytics";
import { PromoCodeManagement } from "../components/promotions/PromoCodeManagement";
import { PromoCodeModals } from "../components/promotions/PromoCodeModals";

export default function Promotions() {
  const { theme } = usePageThemeContext();
  
  const [activeView, setActiveView] = useState("dashboard");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { label: "Dashboard", key: "dashboard", icon: <FiGift /> },
    { label: "Create", key: "create", icon: <FiPlus /> },
    { label: "Analytics", key: "analytics", icon: <FiBarChart /> },
    { label: "Management", key: "management", icon: <FiEdit /> },
  ];

  const handleCreatePromoCode = () => {
    setShowCreateModal(true);
  };

  const handleEditPromoCode = (promoCode) => {
    setSelectedPromoCode(promoCode);
    setShowEditModal(true);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": 
        return <PromoCodeDashboard onEditPromoCode={handleEditPromoCode} />;
      case "create": 
        return <PromoCodeBuilder />;
      case "analytics": 
        return <PromoCodeAnalytics />;
      case "management": 
        return <PromoCodeManagement onEditPromoCode={handleEditPromoCode} />;
      default: 
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
              <p className="text-gray-600 mt-1">Create and manage discount codes for your business</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreatePromoCode}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
              >
                <FiPlus className="h-5 w-5" />
                <span>New Promo Code</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === tab.key
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            {renderView()}
          </div>
        </div>

        {/* Modals */}
        <PromoCodeModals
          createModalOpen={showCreateModal}
          editModalOpen={showEditModal}
          selectedPromoCode={selectedPromoCode}
          onCloseCreateModal={() => setShowCreateModal(false)}
          onCloseEditModal={() => {
            setShowEditModal(false);
            setSelectedPromoCode(null);
          }}
        />
      </div>
    </div>
  );
}
