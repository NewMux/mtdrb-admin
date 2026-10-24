import * as React from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { UnifiedModal } from "../ui/UnifiedModal";
import { SmartButton } from "../ui/DesignSystem";
import { useAuth } from "../../contexts/AuthContext";
import { previewUpgradeToPro, upgradeToPro, type Money, type UpgradePreview } from "../../api/billing";

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called once the gym is on Pro (or was already), so the page can reload its plan. */
  onDone: () => void | Promise<void>;
}

/** "USD 21.50" style fallback if the browser does not know the currency code. */
function formatMoney({ amount, currency }: Money, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/**
 * Starter -> Pro on the existing subscription (paddle-change-plan). Shows what
 * will be charged today and the new monthly price BEFORE the button, because
 * confirming bills the card immediately. The Edge Function works out and
 * enforces all of it; this only asks and explains.
 */
const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose, onDone }) => {
  const { t, i18n } = useTranslation();
  const { userMetadata } = useAuth();
  const isAdmin = userMetadata?.role === "admin";

  const [preview, setPreview] = React.useState<UpgradePreview | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !isAdmin) return;
    let cancelled = false;
    setPreview(null);
    setLoadError(null);
    previewUpgradeToPro().then(
      (result) => {
        if (!cancelled) setPreview(result);
      },
      (error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : t("upgradePlan.loadFailed"));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isOpen, isAdmin, t]);

  const handleConfirm = async () => {
    setWorking(true);
    try {
      const result = await upgradeToPro();
      if (result.alreadyOnPro) toast(t("upgradePlan.alreadyPro"));
      else {
        toast.success(t("upgradePlan.success"));
        if (!result.synced) toast(t("upgradePlan.pendingSync"));
      }
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error") || "Something went wrong");
    } finally {
      setWorking(false);
    }
  };

  const handleClose = () => {
    if (!working) onClose();
  };

  const canConfirm = isAdmin && preview !== null && !working;
  const footer = (
    <>
      <SmartButton variant="secondary" onClick={handleClose} disabled={working}>
        {t("common.cancel") || "Cancel"}
      </SmartButton>
      {isAdmin && (
        <SmartButton variant="primary" onClick={handleConfirm} loading={working} disabled={!canConfirm} className="bg-blue-600 hover:bg-blue-700">
          {working ? t("upgradePlan.working") : t("upgradePlan.confirm")}
        </SmartButton>
      )}
    </>
  );

  const locale = i18n.language || "en";

  return (
    <UnifiedModal isOpen={isOpen} onClose={handleClose} title={t("upgradePlan.title")} footer={footer} maxWidth="lg" slideFrom="center">
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 text-start">
        {!isAdmin ? (
          <p>{t("upgradePlan.notAdmin")}</p>
        ) : (
          <>
            <p>{t("upgradePlan.intro")}</p>
            <p>{t("upgradePlan.gain")}</p>
            {loadError ? (
              <p role="alert" className="text-red-700 dark:text-red-300">
                {loadError}
              </p>
            ) : !preview ? (
              <p role="status" className="text-gray-500 dark:text-gray-400">
                {t("upgradePlan.calculating")}
              </p>
            ) : preview.alreadyOnPro ? (
              <p>{t("upgradePlan.alreadyPro")}</p>
            ) : (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {preview.chargeNow
                    ? t("upgradePlan.chargeToday", { amount: formatMoney(preview.chargeNow, locale) })
                    : t("upgradePlan.chargeTodayUnknown")}
                </p>
                <p className="text-gray-500 dark:text-gray-400">{t("upgradePlan.chargeNote")}</p>
                {preview.recurring && (
                  <p>
                    {preview.nextBilledAt
                      ? t("upgradePlan.renewal", {
                          date: new Date(preview.nextBilledAt).toLocaleDateString(),
                          amount: formatMoney(preview.recurring, locale),
                        })
                      : t("upgradePlan.renewalNoDate", { amount: formatMoney(preview.recurring, locale) })}
                  </p>
                )}
                {preview.extraLocations > 0 && <p>{t("upgradePlan.extraLocations", { count: preview.extraLocations })}</p>}
              </>
            )}
          </>
        )}
      </div>
    </UnifiedModal>
  );
};

export default UpgradePlanModal;
