import * as React from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { SmartButton } from "../../ui/DesignSystem";
import { PLATFORM_CURRENCY } from "../../../config/runtimeConfig";
import {
  INCLUDED_LOCATIONS,
  MAX_EXTRA_LOCATIONS,
  canBuyExtraLocation,
  extraLocationPrice,
  setExtraLocations,
  unusedExtraLocations,
  type LocationUsage,
} from "../../../api/locations";

interface ExtraLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: LocationUsage;
  /** "add": buy one more extra location. "release": stop paying for the ones no branch uses. */
  mode: "add" | "release";
  /** Called once billing has changed, so the page can reload and (for "add") carry on creating the branch. */
  onDone: () => void;
}

/**
 * Explains what an extra location costs and, on confirmation, changes the
 * number of paid extra locations through the paddle-manage-locations function.
 * Adding charges the prorated amount immediately, so the price and that fact
 * are shown before the button.
 */
const ExtraLocationModal: React.FC<ExtraLocationModalProps> = ({ isOpen, onClose, usage, mode, onDone }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);

  const price = extraLocationPrice(usage.planTier);
  const unused = unusedExtraLocations(usage);
  const planName = t(usage.planTier === "pro" ? "landing.pro" : "landing.starter");

  // Adding must open a slot, not just move toward one. A gym that already has
  // more branches than its plan allows (it subscribed with several) needs
  // enough extras to cover them AND the new one: limit = 1 + extras > used.
  const target = mode === "add" ? Math.max(usage.extraLocations + 1, usage.used) : usage.extraLocations - unused;
  const toBuy = target - usage.extraLocations;

  const blocker = !usage.isAdmin
    ? t("branches.locations.notAdmin", { count: INCLUDED_LOCATIONS })
    : !canBuyExtraLocation(usage) || price === null
      ? t("branches.locations.notBillable")
      : mode === "add" && target > MAX_EXTRA_LOCATIONS
        ? t("branches.locations.maxReached")
        : null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await setExtraLocations(target);
      toast.success(mode === "add" ? t("branches.locations.added") : t("branches.locations.released"));
      if (!result.synced) toast(t("branches.locations.pendingSync"));
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error") || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const footer = (
    <>
      <SmartButton variant="secondary" onClick={handleClose} disabled={loading}>
        {t("common.cancel") || "Cancel"}
      </SmartButton>
      {!blocker && (
        <SmartButton variant="primary" onClick={handleConfirm} loading={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading
            ? t("branches.locations.working")
            : mode === "add"
              ? t("branches.locations.addConfirm")
              : t("branches.locations.releaseConfirm")}
        </SmartButton>
      )}
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "add" ? t("branches.locations.addTitle") : t("branches.locations.releaseTitle")}
      footer={footer}
      maxWidth="lg"
      slideFrom="center"
    >
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 text-start">
        {blocker ? (
          <p>{blocker}</p>
        ) : mode === "add" ? (
          <>
            <p>{t("branches.locations.addIntro", { plan: planName, count: INCLUDED_LOCATIONS })}</p>
            {toBuy > 1 && (
              <p>{t("branches.locations.addCatchUp", { used: usage.used, count: toBuy })}</p>
            )}
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {t("branches.locations.addCost", { amount: (price ?? 0) * toBuy, currency: PLATFORM_CURRENCY })}
            </p>
            <p className="text-gray-500 dark:text-gray-400">{t("branches.locations.addProration")}</p>
          </>
        ) : (
          <>
            <p>{t("branches.locations.releaseIntro", { count: unused })}</p>
            <p className="text-gray-500 dark:text-gray-400">
              {t("branches.locations.releaseSaving", {
                amount: (price ?? 0) * unused,
                currency: PLATFORM_CURRENCY,
              })}
            </p>
          </>
        )}
      </div>
    </UnifiedModal>
  );
};

export default ExtraLocationModal;
