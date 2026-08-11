import React, { useState, useEffect, useCallback } from "react";
import {
  FiLink,
  FiCheck,
  FiX,
  FiSettings,
  FiSave,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { fetchGymSettings, updateGymSettings } from "../../api/settings";

interface IntegrationSettingsProps {
  refreshKey: number;
}

// No third-party OAuth/API-key management backend exists yet for any of
// these - none are actually connected. Only the enabled/disabled flag
// (no secrets) is persisted; real credentials would need a server-side
// secrets store, not this client-readable settings table.
const DEFAULT_INTEGRATIONS = [
  { id: "stripe", name: "Stripe", description: "Payment processing and billing", enabled: false },
  { id: "mailgun", name: "Mailgun", description: "Email delivery service", enabled: false },
  { id: "twilio", name: "Twilio", description: "SMS and voice communications", enabled: false },
  { id: "zapier", name: "Zapier", description: "Workflow automation", enabled: false },
];

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  refreshKey,
}) => {
  const { tenantId } = useAuth();
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [existingMetadata, setExistingMetadata] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadIntegrations = async () => {
      if (!tenantId) return;
      const { data } = await fetchGymSettings(tenantId);
      const metadata = data?.metadata || {};
      setExistingMetadata(metadata);
      const savedEnabled = metadata.integrations_enabled as
        | Record<string, boolean>
        | undefined;
      if (savedEnabled) {
        setIntegrations((prev) =>
          prev.map((integration) => ({
            ...integration,
            enabled: savedEnabled[integration.id] ?? integration.enabled,
          })),
        );
      }
    };
    loadIntegrations();
  }, [tenantId, refreshKey]);

  const toggleIntegration = (id: string) => {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) return;
    if (!integration.enabled) {
      toast(
        `${integration.name} isn't connected yet - real integration setup requires a backend API-key/OAuth flow that isn't built. Toggling this just marks it as enabled for when it is.`,
        { icon: "ℹ️" },
      );
    }
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)),
    );
  };

  const handleSave = useCallback(async () => {
    if (!tenantId) {
      toast.error("No tenant ID found. Please log in again.");
      return;
    }
    setIsSaving(true);
    try {
      const integrationsEnabled = integrations.reduce<Record<string, boolean>>(
        (acc, integration) => {
          acc[integration.id] = integration.enabled;
          return acc;
        },
        {},
      );
      const { error } = await updateGymSettings(tenantId, {
        metadata: {
          ...existingMetadata,
          integrations_enabled: integrationsEnabled,
        },
      });
      if (error) throw error;
      toast.success("Integration settings saved");
    } catch (error) {
      console.error("Failed to save integration settings:", error);
      toast.error("Failed to save integration settings");
    } finally {
      setIsSaving(false);
    }
  }, [tenantId, existingMetadata, integrations]);

  const getStatusColor = (enabled: boolean) => {
    return enabled ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? (
      <FiCheck className="h-4 w-4" />
    ) : (
      <FiX className="h-4 w-4" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Integration Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure third-party integrations and API connections
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

      {/* Integrations List */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <FiLink className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Available Integrations
          </h2>
        </div>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="border border-gray-200 dark:border-gray-600 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                    <FiLink className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {integration.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {integration.description}
                    </p>
                    <div
                      className={`flex items-center space-x-2 ${getStatusColor(integration.enabled)}`}
                    >
                      {getStatusIcon(integration.enabled)}
                      <span className="text-sm font-medium">
                        {integration.enabled ? "Enabled" : "Not connected"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleIntegration(integration.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    integration.enabled
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {integration.enabled ? "Disable" : "Connect"}
                </button>
              </div>

              {integration.enabled && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Real API key/webhook configuration for {integration.name} isn&apos;t available yet -
                    this requires a server-side integration flow that hasn&apos;t been built.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <FiSettings className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Rate Limit
            </label>
            <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-blue-600 focus:ring-0 dark:text-gray-100">
              <option>1000 requests/hour</option>
              <option>5000 requests/hour</option>
              <option>10000 requests/hour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook Timeout
            </label>
            <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-blue-600 focus:ring-0 dark:text-gray-100">
              <option>30 seconds</option>
              <option>60 seconds</option>
              <option>120 seconds</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
