import React from "react";
import {
  FiBell,
  FiDollarSign,
  FiUserPlus,
  FiMessageSquare,
} from "react-icons/fi";
import { Switch } from "@headlessui/react";

interface Settings {
  reminderEnabled: boolean;
  dynamicPricing: boolean;
  autoWaitlist: boolean;
  recommendationsEnabled: boolean;
}

interface Props {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function ClassAutomation({ settings, onSettingsChange }: Props) {
  const handleToggle = (key: string, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const automationRules = [
    {
      id: "reminders",
      title: "Smart Reminders",
      description:
        "Automatically send personalized reminders to members before classes",
      icon: FiBell,
      enabled: settings.reminderEnabled,
      key: "reminderEnabled",
      stats: {
        sent: 245,
        engagement: "87%",
      },
      settings: [
        { label: "24 hours before class", enabled: true },
        { label: "1 hour before class", enabled: true },
        { label: "No-show follow-up", enabled: false },
      ],
    },
    {
      id: "pricing",
      title: "Dynamic Pricing",
      description:
        "Automatically adjust class prices based on demand and capacity",
      icon: FiDollarSign,
      enabled: settings.dynamicPricing,
      key: "dynamicPricing",
      stats: {
        revenue: "+15%",
        optimization: "92%",
      },
      settings: [
        { label: "Peak hours adjustment", enabled: true },
        { label: "Low attendance discount", enabled: true },
        { label: "Premium time slots", enabled: false },
      ],
    },
    {
      id: "waitlist",
      title: "Smart Waitlist",
      description:
        "Automatically manage waitlists and notify members of openings",
      icon: FiUserPlus,
      enabled: settings.autoWaitlist,
      key: "autoWaitlist",
      stats: {
        filled: 78,
        conversion: "65%",
      },
      settings: [
        { label: "Auto-fill from waitlist", enabled: true },
        { label: "Priority member boost", enabled: true },
        { label: "Standby notifications", enabled: true },
      ],
    },
    {
      id: "recommendations",
      title: "Class Recommendations",
      description:
        "Smart-powered class recommendations for members based on their preferences",
      icon: FiMessageSquare,
      enabled: settings.recommendationsEnabled,
      key: "recommendationsEnabled",
      stats: {
        accuracy: "94%",
        bookings: "+23%",
      },
      settings: [
        { label: "Personalized suggestions", enabled: true },
        { label: "Similar class matching", enabled: true },
        { label: "Schedule optimization", enabled: false },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Smart Automation Center
        </h2>
        <p className="text-blue-700">
          Enable intelligent automation features to streamline your class
          management and enhance member experience.
        </p>
      </div>

      {/* Automation Rules */}
      <div className="grid grid-cols-1 gap-6">
        {automationRules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <rule.icon className="text-blue-500 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {rule.title}
                    </h3>
                    <p className="text-gray-500 mt-1">{rule.description}</p>
                  </div>
                </div>
                <Switch
                  checked={rule.enabled}
                  onChange={(checked) => handleToggle(rule.key, checked)}
                  className={`${
                    rule.enabled ? "bg-blue-600" : "bg-gray-200"
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      rule.enabled ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {Object.entries(rule.stats).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 capitalize">{key}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Settings */}
              {rule.enabled && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Rule Settings
                  </h4>
                  <div className="space-y-3">
                    {rule.settings.map((setting, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          {setting.label}
                        </span>
                        <Switch
                          checked={setting.enabled}
                          onChange={() => {}}
                          className={`${
                            setting.enabled ? "bg-blue-600" : "bg-gray-200"
                          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                        >
                          <span
                            className={`${
                              setting.enabled
                                ? "translate-x-5"
                                : "translate-x-1"
                            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Automation Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Time Saved</p>
            <p className="text-2xl font-bold text-gray-900">12.5 hrs/week</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Member Satisfaction</p>
            <p className="text-2xl font-bold text-green-600">↑ 24%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Revenue Impact</p>
            <p className="text-2xl font-bold text-blue-600">+$2,450/mo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
