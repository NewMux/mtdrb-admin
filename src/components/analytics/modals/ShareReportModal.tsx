import * as React from "react";
import {
  FiShare2,
  FiLink,
  FiUsers,
  FiClock,
  FiLock,
  FiUnlock,
  FiCopy,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface ShareReportModalProps {
  open: boolean;
  onClose: () => void;
  reportId?: string;
  reportName?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const permissionLevels = [
  {
    id: "view",
    label: "View Only",
    description: "Can view but not edit or share",
    icon: FiUnlock,
  },
  {
    id: "comment",
    label: "Comment",
    description: "Can view and add comments",
    icon: FiUsers,
  },
  {
    id: "edit",
    label: "Edit",
    description: "Can view, comment, and edit",
    icon: FiLock,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full access including sharing",
    icon: FiLock,
  },
];

export default function ShareReportModal({
  open,
  onClose,
  reportName = "Member Overview Report",
  onSuccess,
  isPro,
}: ShareReportModalProps) {
  const { loading, alerts, clearAlerts } = useSmartAnalyticsModal();

  const isProUser = isPro ?? true;

  // There's no public shared-report route or recipient-notification backend
  // built yet, so this links to the real Analytics page (requires login)
  // rather than promising a token-based public view that doesn't exist.
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const [shareLink] = React.useState(`${appUrl}/dashboard/analytics`);
  const [selectedPermission, setSelectedPermission] = React.useState("view");
  const [expirationDate, setExpirationDate] = React.useState("");
  const [selectedRecipients, setSelectedRecipients] = React.useState<string[]>(
    [],
  );
  const [recipientInput, setRecipientInput] = React.useState("");
  const [sharing, setSharing] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      // No email/notification backend exists to actually deliver this to
      // recipients yet - be honest about that instead of claiming it was
      // sent. Copy the link so the admin can send it themselves.
      await navigator.clipboard.writeText(shareLink);
      toast.success(
        selectedRecipients.length > 0
          ? `Link copied - send it to ${selectedRecipients.join(", ")} yourself (automatic email delivery isn't set up yet)`
          : "Link copied to clipboard",
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to share report:", error);
      toast.error("Failed to copy share link");
    } finally {
      setSharing(false);
    }
  };

  const handleAddRecipient = (email: string) => {
    const trimmed = email.trim();
    if (trimmed && !selectedRecipients.includes(trimmed)) {
      setSelectedRecipients([...selectedRecipients, trimmed]);
    }
    setRecipientInput("");
  };

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r !== email));
  };

  function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {title}
        </h3>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  return (
    <SmartAnalyticsModal
      open={open}
      onClose={onClose}
      title="Share Report"
      subtitle={`Share "${reportName}" with your team`}
    >
      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2 ${
            alert.type === "error"
              ? "bg-red-50 text-red-700"
              : alert.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {alert.message}
        </div>
      ))}
      {!isProUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mb-4">
          Sharing reports is available on Pro plans.
        </div>
      )}

      {/* Share Link */}
      <Section title="Share Link">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FiLink /> Direct Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-2 border rounded-lg bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                {linkCopied ? (
                  <>
                    <FiCheckCircle />
                    Copied!
                  </>
                ) : (
                  <>
                    <FiCopy />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FiLock /> Permission Level
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value)}
              >
                {permissionLevels.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.label} - {permission.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FiClock /> Expiration
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Recipients */}
      <Section title="Add Recipients">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Type an email address to note who this was shared with (delivery isn&apos;t automated yet - copy the link and send it yourself).
          </p>
          {/* Recipient email entry */}
          <div className="relative flex gap-2">
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="name@example.com"
              className="flex-1 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddRecipient(recipientInput);
                }
              }}
            />
            <button
              onClick={() => handleAddRecipient(recipientInput)}
              disabled={!recipientInput.trim()}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Add
            </button>
          </div>

          {/* Selected Recipients */}
          {selectedRecipients.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">
                Selected Recipients ({selectedRecipients.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedRecipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg"
                  >
                    <span className="text-sm">{email}</span>
                    <button
                      onClick={() => handleRemoveRecipient(email)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Smart Recommendations */}
      <Section title="Smart Recommendations">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiShare2 className="text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Smart Suggestions
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Recommended permission: <strong>View Only</strong> for this
                    report type
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Set expiration to <strong>7 days</strong> for sensitive data
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Only add recipients who should have access - the link
                    still requires them to log in to your tenant
                  </span>
                  {!isPro && (
                    <FiLock className="text-gray-400" title="Pro feature" />
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Share Summary */}
      <Section title="Share Summary">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Report</span>
              <span className="text-gray-600">{reportName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Permission</span>
              <span className="text-gray-600 capitalize">
                {selectedPermission}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Recipients</span>
              <span className="text-gray-600">
                {selectedRecipients.length} people
              </span>
            </div>
            {expirationDate && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Expires</span>
                <span className="text-gray-600">
                  {new Date(expirationDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Link Access</span>
              <span className="text-gray-600">Requires login to your tenant</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={onClose}
            disabled={loading || sharing}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleShare}
            disabled={loading || sharing || !isProUser}
          >
            {sharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <FiShare2 />
                Share Report
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
