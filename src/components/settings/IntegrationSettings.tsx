import React, { useState } from "react";
import {
  FiLink,
  FiKey,
  FiCheck,
  FiX,
  FiSettings,
  FiSave,
} from "react-icons/fi";

interface IntegrationSettingsProps {
  refreshKey: number;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  refreshKey,
}) => {
  const [integrations, setIntegrations] = useState([
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing and billing",
      status: "connected",
      apiKey: "sk_test_*********************",
      webhookUrl: "https://api.mtdrb.com/webhooks/stripe",
      enabled: true,
    },
    {
      id: "mailgun",
      name: "Mailgun",
      description: "Email delivery service",
      status: "disconnected",
      apiKey: "",
      webhookUrl: "",
      enabled: false,
    },
    {
      id: "twilio",
      name: "Twilio",
      description: "SMS and voice communications",
      status: "connected",
      apiKey: "AC***********************",
      webhookUrl: "https://api.mtdrb.com/webhooks/twilio",
      enabled: true,
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Workflow automation",
      status: "disconnected",
      apiKey: "",
      webhookUrl: "",
      enabled: false,
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const getStatusColor = (status: string) => {
    return status === "connected" ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (status: string) => {
    return status === "connected" ? (
      <FiCheck className="h-4 w-4" />
    ) : (
      <FiX className="h-4 w-4" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Integration Settings
          </h1>
          <p className="text-gray-600 mt-1">
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
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiLink className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Available Integrations
          </h2>
        </div>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="border border-gray-200 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <FiLink className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {integration.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {integration.description}
                    </p>
                    <div
                      className={`flex items-center space-x-2 ${getStatusColor(integration.status)}`}
                    >
                      {getStatusIcon(integration.status)}
                      <span className="text-sm font-medium capitalize">
                        {integration.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    integration.status === "connected"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {integration.status === "connected"
                    ? "Disconnect"
                    : "Connect"}
                </button>
              </div>

              {integration.status === "connected" && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="password"
                        value={integration.apiKey}
                        readOnly
                        className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200"
                      />
                      <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                        <FiKey className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="text"
                      value={integration.webhookUrl}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-50 rounded-xl border border-gray-200"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <FiSettings className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Rate Limit
            </label>
            <select className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0">
              <option>1000 requests/hour</option>
              <option>5000 requests/hour</option>
              <option>10000 requests/hour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Timeout
            </label>
            <select className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-0">
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
