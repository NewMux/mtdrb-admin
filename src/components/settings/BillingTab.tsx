import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiCheckCircle, FiCreditCard, FiDownload, FiExternalLink, FiRefreshCw } from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";
import { fetchBillingOverview, fetchInvoiceUrl, type BillingOverview, type Invoice, type PaymentMethod } from "../../api/billing";
import { formatMoney } from "../../utils/formatMoney";

/** What Settings knows about the gym's platform subscription row. */
export interface SubscriptionInfo {
  /** The plan (starter, pro, ...) or "Free" when there is no subscription. */
  tier: string;
  startDate?: string;
  isPaid: boolean;
  status?: string;
  trialEnd?: string;
  currentPeriodEnd?: string;
  /** When a cancellation already scheduled in billing takes effect; access continues until then. */
  cancelAt?: string;
  /** "paddle" for a self-service subscription; "manual" for access granted by the platform owner. */
  paymentProvider?: string;
  /** Recurring price (base + extra locations) and its currency, as billing last reported. */
  amount?: number;
  currency?: string;
  extraLocations?: number;
  /** While past_due: access continues until this time. */
  graceUntil?: string;
}

interface BillingTabProps {
  info: SubscriptionInfo;
  /** Only the gym's admin may see the card and invoices (the Edge Function enforces it too). */
  isAdmin: boolean;
  resuming: boolean;
  onUpgrade: () => void;
  onSubscribe: () => void;
  onCancel: () => void;
  onKeep: () => void;
}

const BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  american_express: "American Express",
  amex: "American Express",
  discover: "Discover",
  diners_club: "Diners Club",
  jcb: "JCB",
  union_pay: "UnionPay",
  maestro: "Maestro",
};

const brandName = (brand: string | null): string =>
  brand ? (BRANDS[brand] ?? brand.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())) : "Card";

const planLabel = (tier: string): string => tier.charAt(0).toUpperCase() + tier.slice(1);

const card = "card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm";

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: BillingOverview };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{children}</dd>
    </div>
  );
}

/**
 * Settings -> Billing: the gym's own MTDRB subscription. The plan comes from the
 * subscription row Settings already loads; the card on file and the invoices come
 * from the paddle-billing-info function, and the card is changed on the payment
 * provider's own page (this app never sees card numbers).
 */
const BillingTab: React.FC<BillingTabProps> = ({ info, isAdmin, resuming, onUpgrade, onSubscribe, onCancel, onKeep }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || "en";
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale);

  const selfService = info.paymentProvider === "paddle";
  const [load, setLoad] = React.useState<Load>({ state: "loading" });
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    setLoad({ state: "loading" });
    fetchBillingOverview().then(
      (data) => setLoad({ state: "ready", data }),
      (error: unknown) => setLoad({ state: "error", message: error instanceof Error ? error.message : t("billingTab.loadFailed") }),
    );
  }, [t]);

  React.useEffect(() => {
    if (selfService && isAdmin) refresh();
  }, [selfService, isAdmin, refresh]);

  const handleDownload = async (invoice: Invoice) => {
    setDownloading(invoice.id);
    try {
      // The link is served as an attachment, so the browser downloads it and this page stays open.
      window.location.assign(await fetchInvoiceUrl(invoice.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("billingTab.downloadFailed"));
    } finally {
      setDownloading(null);
    }
  };

  const pastDue = info.status === "past_due";
  const statusBadge = !info.isPaid
    ? null
    : pastDue
      ? { text: t("billingTab.statusPastDue"), warn: true }
      : info.cancelAt
        ? { text: t("billingTab.statusEnding", { date: date(info.cancelAt) }), warn: true }
        : selfService
          ? { text: t("billingTab.statusActive"), warn: false }
          : { text: t("billingTab.statusManaged"), warn: false };

  const canUpgrade = info.isPaid && selfService && info.tier === "starter";
  const canAddLocations = info.isPaid && selfService && (info.tier === "starter" || info.tier === "pro");
  const price =
    info.amount !== undefined && info.amount > 0 && info.currency
      ? t("billingTab.perMonth", { amount: formatMoney(info.amount, info.currency, locale) })
      : null;
  const updateUrl = load.state === "ready" ? load.data.updatePaymentMethodUrl : null;

  return (
    <div className="space-y-6">
      {/* Subscription */}
      <section className={card} aria-labelledby="billing-subscription-title">
        <div className="p-6 pb-0">
          <h3 id="billing-subscription-title" className="text-base font-semibold text-gray-900 dark:text-white">
            {t("billingTab.subscriptionTitle")}
          </h3>
        </div>
        <div className="p-6 pt-4 space-y-4">
          {!info.isPaid ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-600 dark:bg-gray-700/50">
              <p className="text-sm text-gray-700 dark:text-gray-300">{t("billingTab.notSubscribed")}</p>
              <SmartButton variant="primary" size="sm" onClick={onSubscribe}>
                {t("settings.subscribe", "Subscribe")}
              </SmartButton>
            </div>
          ) : (
            <>
              {pastDue && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  <FiAlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <p>
                    {info.graceUntil
                      ? t("billingTab.pastDue", { date: date(info.graceUntil) })
                      : t("billingTab.pastDueNoDate")}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{t("billingTab.planName", { plan: planLabel(info.tier) })}</h4>
                    {statusBadge && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusBadge.warn
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        }`}
                      >
                        <FiCheckCircle className="h-3 w-3" aria-hidden="true" />
                        {statusBadge.text}
                      </span>
                    )}
                  </div>
                  {canUpgrade && (
                    <SmartButton variant="primary" size="sm" onClick={onUpgrade}>
                      {t("planGate.upgradeToPro")}
                    </SmartButton>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {price && <Detail label={t("billingTab.price")}>{price}</Detail>}
                  {info.currentPeriodEnd && (
                    <Detail label={info.cancelAt ? t("billingTab.endsOn") : t("billingTab.nextRenewal")}>
                      {date(info.cancelAt ?? info.currentPeriodEnd)}
                    </Detail>
                  )}
                  {selfService && (
                    <Detail label={t("billingTab.locations")}>
                      {(info.extraLocations ?? 0) > 0
                        ? t("billingTab.locationsWithExtra", { count: info.extraLocations })
                        : t("billingTab.locationsOnly")}
                      {canAddLocations && (
                        <>
                          {" · "}
                          <Link to="/dashboard/branches" className="text-blue-700 underline dark:text-blue-300">
                            {t("billingTab.addLocations")}
                          </Link>
                        </>
                      )}
                    </Detail>
                  )}
                  {info.startDate && <Detail label={t("billingTab.memberSince")}>{date(info.startDate)}</Detail>}
                </dl>
              </div>

              {!selfService && <p className="text-sm text-gray-600 dark:text-gray-300">{t("billingTab.managedNote")}</p>}

              {/* Cancel / keep: only for a self-service subscription. Access granted by the
                  platform owner is changed from the owner console. */}
              {selfService &&
                (info.cancelAt ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                    <div>
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {t("settings.subscriptionEndsTitle", "Your subscription ends on {{date}}", { date: date(info.cancelAt) })}
                      </h4>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{t("settings.subscriptionEndsDesc", "You keep full access until then and won't be billed again.")}</p>
                    </div>
                    <SmartButton variant="secondary" size="sm" onClick={onKeep} loading={resuming} disabled={resuming}>
                      {t("settings.keepSubscriptionBtn", "Keep subscription")}
                    </SmartButton>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-300">{t("settings.cancelSubscription", "Cancel Subscription")}</h4>
                      <p className="mt-1 text-xs text-red-700 dark:text-red-400">{t("settings.cancelSubscriptionDesc", "Stop renewing. You keep access until the end of the period you've paid for.")}</p>
                    </div>
                    <SmartButton variant="danger" size="sm" onClick={onCancel}>
                      {t("settings.cancel", "Cancel")}
                    </SmartButton>
                  </div>
                ))}
            </>
          )}
        </div>
      </section>

      {selfService && !isAdmin && (
        <p className="px-1 text-sm text-gray-600 dark:text-gray-300">{t("billingTab.adminOnly")}</p>
      )}

      {selfService && isAdmin && (
        <>
          {/* Payment method */}
          <section className={card} aria-labelledby="billing-payment-title">
            <div className="p-6 pb-0">
              <h3 id="billing-payment-title" className="text-base font-semibold text-gray-900 dark:text-white">
                {t("billingTab.paymentTitle")}
              </h3>
            </div>
            <div className="p-6 pt-4">
              {load.state === "loading" && (
                <p role="status" className="text-sm text-gray-500 dark:text-gray-400">
                  {t("billingTab.loading")}
                </p>
              )}
              {load.state === "error" && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                    {load.message}
                  </p>
                  <SmartButton variant="secondary" size="sm" onClick={refresh} icon={<FiRefreshCw className="h-4 w-4" />}>
                    {t("billingTab.retry")}
                  </SmartButton>
                </div>
              )}
              {load.state === "ready" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <FiCreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      <PaymentMethodText method={load.data.paymentMethod} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <SmartButton variant="ghost" size="sm" onClick={refresh} icon={<FiRefreshCw className="h-4 w-4" />}>
                        {t("billingTab.refresh")}
                      </SmartButton>
                      {updateUrl && (
                        <a href={updateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary inline-flex items-center gap-2">
                          {t("billingTab.updateMethod")}
                          <FiExternalLink className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t("billingTab.opensInNewTab")}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {updateUrl ? t("billingTab.updateNote") : t("billingTab.updateUnavailable")}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Billing history */}
          <section className={card} aria-labelledby="billing-history-title">
            <div className="p-6 pb-0">
              <h3 id="billing-history-title" className="text-base font-semibold text-gray-900 dark:text-white">
                {t("billingTab.historyTitle")}
              </h3>
            </div>
            <div className="p-6 pt-4">
              {load.state === "loading" && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("billingTab.loading")}</p>
              )}
              {load.state === "error" && <p className="text-sm text-gray-500 dark:text-gray-400">{t("billingTab.invoicesUnavailable")}</p>}
              {load.state === "ready" && !load.data.invoicesAvailable && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("billingTab.invoicesUnavailable")}</p>
              )}
              {load.state === "ready" && load.data.invoicesAvailable && load.data.invoices.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("billingTab.noInvoices")}</p>
              )}
              {load.state === "ready" && load.data.invoicesAvailable && load.data.invoices.length > 0 && (
                <div className="relative overflow-x-auto">
                  {/* relative: the screen-reader-only header below is absolutely positioned and would
                      otherwise escape this scroller and make the whole page scroll sideways on a phone. */}
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-start text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        <th scope="col" className="py-2 pe-4 text-start font-medium">{t("billingTab.colDate")}</th>
                        <th scope="col" className="py-2 pe-4 text-start font-medium">{t("billingTab.colInvoice")}</th>
                        <th scope="col" className="py-2 pe-4 text-start font-medium">{t("billingTab.colAmount")}</th>
                        <th scope="col" className="py-2 pe-4 text-start font-medium">{t("billingTab.colStatus")}</th>
                        <th scope="col" className="py-2 text-end font-medium">
                          <span className="sr-only">{t("billingTab.colActions")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {load.data.invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                          <td className="py-3 pe-4 text-gray-900 dark:text-white">{invoice.billedAt ? date(invoice.billedAt) : "—"}</td>
                          <td className="py-3 pe-4 text-gray-600 dark:text-gray-300">{invoice.number ?? "—"}</td>
                          <td className="py-3 pe-4 text-gray-900 dark:text-white">
                            {invoice.total ? formatMoney(invoice.total.amount, invoice.total.currency, locale) : "—"}
                          </td>
                          <td className="py-3 pe-4">
                            <InvoiceStatus status={invoice.status} />
                          </td>
                          <td className="py-3 text-end">
                            {invoice.canDownload && (
                              <button
                                type="button"
                                onClick={() => void handleDownload(invoice)}
                                disabled={downloading === invoice.id}
                                aria-label={t("billingTab.downloadAria", { number: invoice.number ?? invoice.id })}
                                className="inline-flex min-h-[24px] items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-300 dark:hover:bg-blue-900/20"
                              >
                                <FiDownload className="h-4 w-4" aria-hidden="true" />
                                {t("billingTab.download")}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

function PaymentMethodText({ method }: { method: PaymentMethod | null }) {
  const { t } = useTranslation();
  if (!method) return <p className="text-sm text-gray-600 dark:text-gray-300">{t("billingTab.noMethod")}</p>;
  if (method.type !== "card") {
    return (
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {t("billingTab.methodOther", { type: method.type === "paypal" ? "PayPal" : method.type.replace(/_/g, " ") })}
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {method.last4
          ? t("billingTab.cardEnding", { brand: brandName(method.brand), last4: method.last4 })
          : brandName(method.brand)}
      </p>
      {method.expiryMonth && method.expiryYear && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {t("billingTab.cardExpires", { month: String(method.expiryMonth).padStart(2, "0"), year: method.expiryYear })}
        </p>
      )}
    </div>
  );
}

function InvoiceStatus({ status }: { status: string }) {
  const { t } = useTranslation();
  const paid = status === "completed" || status === "paid";
  const label = paid ? t("billingTab.statusPaid") : status === "past_due" ? t("billingTab.statusInvoicePastDue") : t("billingTab.statusDue");
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        paid
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      }`}
    >
      {label}
    </span>
  );
}

export default BillingTab;
