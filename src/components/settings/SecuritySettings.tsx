import React, { useState } from "react";
import { FiShield, FiLock, FiKey, FiEye, FiEyeOff, FiSave, FiAlertTriangle } from "react-icons/fi";

interface SecuritySettingsProps {
  refreshKey: number;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ refreshKey }) => {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    passwordExpiry: 90,
    minPasswordLength: 8,
    requireSpecialChars: true,
    lockoutThreshold: 5,
    sessionTimeout: 30,
    ipWhitelist: "",
    auditLogging: true,
    dataEncryption: true,
    sslRequired: true
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-1">Configure security policies and authentication settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <FiSave className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Authentication */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiLock className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Authentication</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({...prev, twoFactorAuth: !prev.twoFactorAuth}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiKey className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Password Policy</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
            <input
              type="number"
              value={settings.passwordExpiry}
              onChange={(e) => setSettings(prev => ({...prev, passwordExpiry: parseInt(e.target.value)}))}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Length</label>
            <input
              type="number"
              value={settings.minPasswordLength}
              onChange={(e) => setSettings(prev => ({...prev, minPasswordLength: parseInt(e.target.value)}))}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiShield className="h-6 w-6 text-red-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Security Features</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'requireSpecialChars', label: 'Require Special Characters', description: 'Passwords must contain special characters' },
            { key: 'auditLogging', label: 'Audit Logging', description: 'Log all security-related events' },
            { key: 'dataEncryption', label: 'Data Encryption', description: 'Encrypt sensitive data at rest' },
            { key: 'sslRequired', label: 'SSL Required', description: 'Force HTTPS connections' }
          ].map((feature) => (
            <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <h3 className="font-medium text-gray-900">{feature.label}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({...prev, [feature.key]: !prev[feature.key as keyof typeof prev]}))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[feature.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[feature.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
