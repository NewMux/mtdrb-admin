import * as React from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { SmartButton } from "../../ui/DesignSystem";
import { AppleInput, AppleSelect } from "../../AppleStyleModal";
import { useAuth } from "../../../contexts/AuthContext";
import { useGymConfig } from "../../../contexts/gym-config-context";
import {
  assignMemberPlan,
  listActivePlans,
  type ActivePlan,
  type PlanAssignment,
} from "../../../api/membershipPlans";
import { getCurrencyDecimals } from "../../../utils/invoiceMath";

interface MemberPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: { id: string; name: string; planEnd?: string | null };
  onDone: (result: PlanAssignment) => void;
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Put a member on a plan, or renew them on it. The dates are worked out by the database. */
export default function MemberPlanModal({ isOpen, onClose, member, onDone }: MemberPlanModalProps) {
  const { t } = useTranslation();
  const { tenantId } = useAuth();
  const { config } = useGymConfig();
  const decimals = getCurrencyDecimals(config.currency);

  const [plans, setPlans] = React.useState<ActivePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(true);
  const [planId, setPlanId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);

  const stillPaid = Boolean(member.planEnd) && (member.planEnd as string).slice(0, 10) >= todayKey();
  const [continueFromEnd, setContinueFromEnd] = React.useState(stillPaid);

  React.useEffect(() => {
    if (!isOpen || !tenantId) return;
    let cancelled = false;
    setLoadingPlans(true);
    setLoadFailed(false);
    listActivePlans(tenantId)
      .then((rows) => !cancelled && setPlans(rows))
      .catch(() => !cancelled && setLoadFailed(true))
      .finally(() => !cancelled && setLoadingPlans(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, tenantId]);

  const selected = plans.find((p) => p.id === planId);

  const choose = (id: string) => {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    setPrice(plan ? plan.price.toFixed(decimals) : "");
    setError(null);
  };

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!selected) return;
    const amount = Number(price);
    if (price.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      setError(t("membershipPlans.pricePlaceholder"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await assignMemberPlan(member.id, selected.id, {
        renew: stillPaid && continueFromEnd,
        price: amount,
      });
      toast.success(
        t("membershipPlans.applied", { name: member.name, plan: result.planName, date: result.expiryDate }),
      );
      onDone(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("membershipPlans.failed"));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <SmartButton variant="secondary" onClick={onClose} disabled={saving}>
        {t("common.cancel", "Cancel")}
      </SmartButton>
      <SmartButton variant="primary" onClick={() => submit()} loading={saving} disabled={!selected}>
        {saving ? t("membershipPlans.saving") : t("membershipPlans.save")}
      </SmartButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("membershipPlans.changePlan")}
      subtitle={member.name}
      footer={footer}
      maxWidth="md"
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-start">
          {member.planEnd
            ? t("membershipPlans.currentEnd", { date: member.planEnd.slice(0, 10) })
            : t("membershipPlans.noCurrentEnd")}
        </p>

        {!loadingPlans && plans.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-300 text-start">{t("membershipPlans.noPlansHint")}</p>
        ) : (
          <>
            <AppleSelect
              label={t("membershipPlans.selectPlan")}
              aria-label={t("membershipPlans.selectPlan")}
              value={planId}
              onChange={(e) => choose(e.target.value)}
              disabled={loadingPlans || saving}
            >
              <option value="">{t("membershipPlans.noPlan")}</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </AppleSelect>

            {selected && (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-start">
                  {t("membershipPlans.daysOfAccess", { count: selected.duration })}
                </p>
                <AppleInput
                  label={`${t("membershipPlans.priceLabel")} (${config.currency})`}
                  type="number"
                  min="0"
                  step={decimals === 0 ? "1" : `0.${"0".repeat(decimals - 1)}1`}
                  aria-label={t("membershipPlans.priceLabel")}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={saving}
                />
                {stillPaid ? (
                  <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 text-start">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={continueFromEnd}
                      onChange={(e) => setContinueFromEnd(e.target.checked)}
                      disabled={saving}
                    />
                    <span>{t("membershipPlans.continueFromEnd")}</span>
                  </label>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-start">{t("membershipPlans.startsToday")}</p>
                )}
              </>
            )}
          </>
        )}

        {(error || loadFailed) && (
          <p className="text-sm text-red-600 dark:text-red-400 text-start" role="alert">
            {error ?? t("membershipPlans.loadFailed")}
          </p>
        )}
      </form>
    </UnifiedModal>
  );
}
