import React, { useState } from "react";
import {
  FiEye,
  FiLayout,
  FiEdit,
  FiSave,
  FiMoon,
  FiSun,
} from "react-icons/fi";

interface UserPreferencesProps {
  refreshKey: number;
}

export const UserPreferences: React.FC<UserPreferencesProps> = () => {
  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "en",
    timezone: "America/New_York",
    dashboardLayout: "default",
    showAvatars: true,
    compactView: false,
    autoSave: true,
    emailSignature: "Best regards,\nMTDRB Team",
    welcomeMessage: "Welcome to MTDRB!",
    itemsPerPage: 25,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Preferences</h1>
          <p className="text-gray-600 mt-1">
            Customize your experience and interface settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <FiSave className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiEdit className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: FiSun },
                { value: "dark", label: "Dark", icon: FiMoon },
                { value: "auto", label: "Auto", icon: FiEye },
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() =>
                    setPreferences((prev) => ({ ...prev, theme: theme.value }))
                  }
                  className={`p-4 rounded-2xl border transition-colors ${
                    preferences.theme === theme.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <theme.icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="font-medium text-gray-900">{theme.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interface */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiLayout className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Interface</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              key: "showAvatars",
              label: "Show Avatars",
              description: "Display user profile pictures",
            },
            {
              key: "compactView",
              label: "Compact View",
              description: "Use compact layout for tables and lists",
            },
            {
              key: "autoSave",
              label: "Auto Save",
              description: "Automatically save changes",
            },
          ].map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
            >
              <div>
                <h3 className="font-medium text-gray-900">{setting.label}</h3>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>
              <button
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    [setting.key]: !prev[setting.key as keyof typeof prev],
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences[setting.key as keyof typeof preferences]
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[setting.key as keyof typeof preferences]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
