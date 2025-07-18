import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiUser, FiShield, FiBell, FiCreditCard, FiDatabase, FiGlobe, FiDownload, FiUpload } from 'react-icons/fi';
import { SmartButton } from '../components/ui/DesignSystem';
import { SmartSettingsDashboard } from '../components/settings/SmartSettingsDashboard';
import { AnimatePresence } from 'framer-motion';
import { usePageThemeContext } from '../contexts/PageThemeContext';

const Settings: React.FC = () => {
  const { theme } = usePageThemeContext();
  
  const [activeTab, setActiveTab] = React.useState('general');
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: FiSettings },
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'security', name: 'Security', icon: FiShield },
  
    { id: 'billing', name: 'Billing', icon: FiCreditCard },
    { id: 'integrations', name: 'Integrations', icon: FiDatabase },
  ];

  const settings = [
    {
      id: 'gym-name',
      title: 'Gym Name',
      description: 'Your gym\'s display name',
      value: 'MTDRB Fit',
      type: 'text',
    },
    {
      id: 'timezone',
      title: 'Timezone',
      description: 'Your local timezone',
      value: 'Asia/Riyadh',
      type: 'select',
    },
    {
      id: 'currency',
      title: 'Currency',
      description: 'Default currency for billing',
      value: 'SAR',
      type: 'select',
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Interface language',
      value: 'English',
      type: 'select',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your gym's configuration and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">General Settings</h3>
                
                <div className="space-y-6">
                  {settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{setting.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {setting.type === 'text' && (
                          <input
                            type="text"
                            defaultValue={setting.value}
                            className="form-input w-48"
                          />
                        )}
                        {setting.type === 'select' && (
                          <select className="form-select w-48">
                            <option>{setting.value}</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Switch between light and dark themes</p>
                    </div>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        isDarkMode ? 'bg-sky-500' : 'bg-gray-300'
                      } flex items-center ${isDarkMode ? 'justify-end' : 'justify-start'} px-1`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
                <SmartButton variant="secondary" size="sm">
                  Save Changes
                </SmartButton>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Settings</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Profile Picture</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Upload a new profile picture</p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Change
                    </SmartButton>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">First Name</label>
                      <input type="text" defaultValue="Admin" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Last Name</label>
                      <input type="text" defaultValue="User" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input type="email" defaultValue="admin@mtdrb.com" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <input type="tel" defaultValue="+966 50 123 4567" className="form-input" />
                    </div>
                  </div>
                </div>
                <SmartButton variant="secondary" size="sm">
                  Save Changes
                </SmartButton>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add an extra layer of security</p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Enable
                    </SmartButton>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Update your account password</p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Change
                    </SmartButton>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Login History</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View recent login activity</p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      View
                    </SmartButton>
                  </div>
                </div>
                <SmartButton variant="secondary" size="sm">
                  Save Changes
                </SmartButton>
              </div>
            </div>
          )}



          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Billing Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Current Plan</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Premium Plan - $99/month</p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Upgrade
                    </SmartButton>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Payment Method</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Visa ending in 4242</p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Update
                    </SmartButton>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Billing History</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View past invoices</p>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      View
                    </SmartButton>
                  </div>
                </div>
                <SmartButton variant="secondary" size="sm">
                  Save Changes
                </SmartButton>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Third-Party Integrations</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                        <FiGlobe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Google Calendar</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sync class schedules</p>
                      </div>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Connect
                    </SmartButton>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                        <FiDatabase className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Stripe Payments</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Process payments</p>
                      </div>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Connected
                    </SmartButton>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                        <FiBell className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Slack</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Team notifications</p>
                      </div>
                    </div>
                    <SmartButton variant="secondary" size="sm">
                      Connect
                    </SmartButton>
                  </div>
                </div>
                <SmartButton variant="secondary" size="sm">
                  Save Changes
                </SmartButton>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Settings;
