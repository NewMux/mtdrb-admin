import React from "react";
import { Link } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import {
  PLATFORM_CURRENCY,
  PRO_EXTRA_LOCATION_PRICE,
  STARTER_EXTRA_LOCATION_PRICE,
  SUBSCRIPTION_PLANS,
} from "../../config/runtimeConfig";
import { trackMarketingEvent } from "../../utils/marketingTracking";

// Short Arabic currency names for the codes this app actually bills in.
// Falls back to the raw ISO code for anything not listed, so a misconfigured
// or unmapped currency never silently mislabels itself as a different one.
const CURRENCY_SHORT_LABELS_AR: Record<string, string> = {
  USD: "دولار",
  AED: "درهم",
  SAR: "ريال سعودي",
  OMR: "ريال عماني",
  QAR: "ريال قطري",
  KWD: "دينار كويتي",
  BHD: "دينار بحريني",
  EGP: "جنيه مصري",
  EUR: "يورو",
  GBP: "جنيه إسترليني",
};

interface PricingPlansProps {
  /** Where the sign-up buttons sit, for the marketing event (e.g. "pricing"). */
  placement: string;
}

/**
 * The two plan cards with their monthly price, the extra-location price and a
 * sign-up button. Shared by the landing page's pricing section and the
 * standalone /pricing page that Paddle's website review looks at, so the two
 * can never show different numbers.
 */
const PricingPlans: React.FC<PricingPlansProps> = ({ placement }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const starterPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "starter");
  const proPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "pro");
  const currencyCode = (starterPlan?.currency || proPlan?.currency || PLATFORM_CURRENCY).toUpperCase();
  const currencyLabel = isRTL ? CURRENCY_SHORT_LABELS_AR[currencyCode] || currencyCode : currencyCode;

  const plans = [
    {
      id: "starter",
      name: t("landing.starter"),
      desc: t("home.plan_starter_desc"),
      price: starterPlan?.price ?? 0,
      extra: STARTER_EXTRA_LOCATION_PRICE,
      features: [t("landing.allCoreFeatures"), t("landing.singleLocation"), t("landing.emailSupport")],
      featured: false,
    },
    {
      id: "pro",
      name: t("landing.pro"),
      desc: t("home.plan_pro_desc"),
      price: proPlan?.price ?? 0,
      extra: PRO_EXTRA_LOCATION_PRICE,
      features: [
        t("landing.everythingInStarter"),
        t("landing.unlimitedMembers"),
        t("landing.advancedAnalytics"),
        t("landing.prioritySupport"),
      ],
      featured: true,
    },
  ];

  return (
    <div className="grid overflow-hidden rounded-2xl bg-[#F5F5F7] md:grid-cols-2 md:divide-x md:divide-black/[0.08] rtl:md:divide-x-reverse">
      {plans.map((plan, index) => (
        <div
          key={plan.id}
          className={`flex flex-col p-8 sm:p-10 ${index > 0 ? "border-t border-black/[0.08] md:border-t-0" : ""}`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            {plan.featured && <span className="text-[13px] font-medium text-blue-600">{t("landing.most_popular")}</span>}
          </div>
          <p className="mt-1 text-[15px] text-gray-500">{plan.desc}</p>
          <p className="mt-6 flex items-baseline gap-1.5">
            <span className="text-5xl font-semibold tracking-tight tabular-nums">{plan.price}</span>
            <span className="text-[15px] text-gray-500">
              {currencyLabel}
              {t("landing.usdPerMonth")}
            </span>
          </p>
          <p className="mt-1 text-[13px] text-gray-500">
            +{plan.extra} {currencyLabel}
            {t("landing.usdPerMonth")} {t("landing.perExtraLocation")}
          </p>
          <ul className="mt-7 flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[15px] text-gray-700">
                <FiCheck className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/signup"
            onClick={() => trackMarketingEvent("trial_cta_click", { placement: `${plan.id}-${placement}` })}
            className={
              plan.featured
                ? "mt-8 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-blue-700"
                : "mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-gray-900 shadow-[0_0_0_0.5px_rgba(0,0,0,0.15)] transition-colors hover:bg-gray-50"
            }
          >
            {t("home.get_started")}
          </Link>
        </div>
      ))}
    </div>
  );
};

export default PricingPlans;
