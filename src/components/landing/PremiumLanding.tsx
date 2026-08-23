import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiGlobe,
  FiGrid,
  FiMenu,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import {
  PLATFORM_CURRENCY,
  PRO_EXTRA_LOCATION_PRICE,
  STARTER_EXTRA_LOCATION_PRICE,
  SUBSCRIPTION_PLANS,
} from "../../config/runtimeConfig";

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

const PremiumLanding: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const direction = isRTL ? "rtl" : "ltr";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const starterPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "starter");
  const proPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "pro");
  const currencyLabel = (starterPlan?.currency || proPlan?.currency || PLATFORM_CURRENCY).toUpperCase();
  const pricingCurrencyLabel = isRTL
    ? CURRENCY_SHORT_LABELS_AR[currencyLabel] || currencyLabel
    : currencyLabel;

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  const capabilities = [
    {
      key: "operations",
      icon: FiGrid,
      title: t("landing.capability_operations"),
      description: t("landing.capability_operations_desc"),
    },
    {
      key: "growth",
      icon: FiTrendingUp,
      title: t("landing.capability_growth"),
      description: t("landing.capability_growth_desc"),
    },
    {
      key: "local",
      icon: FiGlobe,
      title: t("landing.capability_local"),
      description: t("landing.capability_local_desc"),
    },
  ];

  const features = [
    {
      icon: FiCalendar,
      title: t("landing.smartScheduling"),
      outcome: t("landing.feature_schedule_outcome"),
      description: t("landing.smartSchedulingDesc"),
      image: "/Calendar.png",
      alt: t("landing.smartSchedulingImage"),
      checks: [
        t("landing.automaticConflictDetection"),
        t("landing.intelligentWaitlistManagement"),
        t("landing.recurringClassPatterns"),
      ],
    },
    {
      icon: FiUsers,
      title: t("landing.memberRetention"),
      outcome: t("landing.feature_members_outcome"),
      description: t("landing.memberRetentionDesc"),
      image: "/Members.png",
      alt: t("landing.memberRetentionImage"),
      checks: [
        t("landing.automatedAttendanceTracking"),
        t("landing.churnRiskIdentification"),
        t("landing.engagementScoring"),
      ],
    },
    {
      icon: FiDollarSign,
      title: t("landing.financialCommand"),
      outcome: t("landing.feature_finance_outcome"),
      description: t("landing.financialCommandDesc"),
      image: "/Billing.png",
      alt: t("landing.financialCommandImage"),
      checks: [
        t("landing.automatedInvoicing"),
        t("landing.multiCurrencySupport"),
        t("landing.realTimeFinancialInsights"),
      ],
    },
  ];

  const navLinkClass = "text-apple-gray-500 hover:text-apple-gray-700";

  return (
    <div
      className="landing-page font-apple min-h-screen overflow-x-hidden bg-white text-apple-gray-700 antialiased"
      dir={direction}
    >
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/80 text-apple-gray-700 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label={t("landing.home_link")}>
            <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-5 w-auto sm:h-[22px]" />
            <span className="hidden border-s border-black/10 ps-2.5 text-[11px] font-normal text-apple-gray-400 sm:inline">
              إدارة
            </span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <button onClick={() => scrollTo("#features")} className={`text-[13px] font-normal transition-colors ${navLinkClass}`}>
              {t("navbar.features")}
            </button>
            <button onClick={() => scrollTo("#workflow")} className={`text-[13px] font-normal transition-colors ${navLinkClass}`}>
              {t("navbar.how")}
            </button>
            <button onClick={() => scrollTo("#pricing")} className={`text-[13px] font-normal transition-colors ${navLinkClass}`}>
              {t("navbar.pricing")}
            </button>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <LanguageSwitcher />
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-appleBlue-500 px-4 py-1.5 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-appleBlue-600"
            >
              {t("landing.get_started")}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-full p-2 text-apple-gray-700 transition-colors hover:bg-black/5 md:hidden"
            aria-label={mobileMenuOpen ? t("landing.close_menu") : t("landing.open_menu")}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-black/5 bg-white px-5 py-5 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollTo("#features")} className="text-start text-sm font-normal text-apple-gray-500 hover:text-apple-gray-700">
                {t("navbar.features")}
              </button>
              <button onClick={() => scrollTo("#workflow")} className="text-start text-sm font-normal text-apple-gray-500 hover:text-apple-gray-700">
                {t("navbar.how")}
              </button>
              <button onClick={() => scrollTo("#pricing")} className="text-start text-sm font-normal text-apple-gray-500 hover:text-apple-gray-700">
                {t("navbar.pricing")}
              </button>
              <div className="border-t border-black/5 pt-4">
                <LanguageSwitcher />
              </div>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-appleBlue-500 px-4 py-2.5 text-sm font-medium text-white"
              >
                {t("landing.get_started")}
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-white pb-20 pt-36 sm:pt-44">
          <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-sm font-semibold text-appleBlue-500">{t("landing.eyebrow")}</p>

              <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-apple-gray-700 sm:text-6xl lg:text-7xl">
                {t("landing.hero_title")} <span className="text-appleBlue-500">{t("landing.hero_title_highlight")}</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-apple-gray-400 sm:text-xl">
                {t("landing.hero_description")}
              </p>
              <p className="mx-auto mt-2 max-w-lg text-base leading-7 text-apple-gray-300">
                {t("landing.hero_supporting")}
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-appleBlue-500 px-7 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-appleBlue-600"
                >
                  {t("landing.startFreeTrial")}
                </Link>
                <button
                  onClick={() => scrollTo("#features")}
                  className="group inline-flex items-center justify-center gap-1 text-base font-medium text-appleBlue-500 transition-colors hover:text-appleBlue-600"
                >
                  {t("landing.seeHowItWorks")}
                  <FiArrowRight
                    className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isRTL ? "rotate-180 group-hover:-translate-x-0.5" : ""}`}
                  />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-normal text-apple-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  {t("landing.hero_free_trial")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FiShield className="h-3.5 w-3.5" />
                  {t("landing.hero_no_card")}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="relative mt-16 sm:mt-20"
            >
              <div className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-apple-gray-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-appleBlue-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-appleBlue-500" />
                </span>
                {t("landing.hero_proof_label")} · {t("landing.hero_live")}
              </div>

              <div className="overflow-hidden rounded-2xl border border-black/5 bg-apple-light shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]">
                <img src="/Dashboard.png" alt={t("landing.dashboardPreview")} className="block h-auto w-full" />
              </div>

              <div className="mx-auto mt-6 max-w-xl text-center">
                <p className="text-base font-semibold text-apple-gray-700">{t("landing.hero_proof_title")}</p>
                <p className="mt-1 text-sm text-apple-gray-400">{t("landing.hero_proof_caption")}</p>
              </div>

              <div className="mx-auto mt-9 grid max-w-2xl grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-apple-gray-700">1,247</p>
                  <p className="mt-1 text-xs font-normal text-apple-gray-400">{t("landing.hero_stat_members")}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-apple-gray-700">78%</p>
                  <p className="mt-1 text-xs font-normal text-apple-gray-400">{t("landing.hero_stat_attendance")}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-apple-gray-700">{t("landing.hero_stat_revenue_value")}</p>
                  <p className="mt-1 text-xs font-normal text-apple-gray-400">{t("landing.hero_stat_revenue")}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="relative mt-20 border-t border-black/5 bg-apple-light">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-5 text-center text-xs font-normal text-apple-gray-400 sm:flex-row sm:justify-between sm:px-8">
              <span>{t("landing.hero_made_for_menat")}</span>
              <div className="flex flex-wrap items-center justify-center gap-5">
                <span className="inline-flex items-center gap-1.5">
                  <FiGlobe className="h-3.5 w-3.5" />
                  {t("landing.trust_bilingual")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FiShield className="h-3.5 w-3.5" />
                  {t("landing.trust_vat")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FiZap className="h-3.5 w-3.5" />
                  {t("landing.trust_region")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="bg-apple-light py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-sm font-semibold text-appleBlue-500">{t("landing.essentials_label")}</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-apple-gray-700 sm:text-5xl">
                {t("landing.essentials_title")}
              </h2>
              <p className="mt-5 text-base leading-7 text-apple-gray-400">{t("landing.essentials_desc")}</p>
            </motion.div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {capabilities.map((capability, index) => {
                const Icon = capability.icon;
                return (
                  <motion.article
                    key={capability.key}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-appleBlue-50 text-appleBlue-500">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-6 text-lg font-semibold tracking-tight text-apple-gray-700">{capability.title}</h3>
                    <p className="mt-2.5 text-sm leading-6 text-apple-gray-400">{capability.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Showcase */}
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-sm font-semibold text-appleBlue-500">{t("landing.showcase_label")}</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-apple-gray-700 sm:text-5xl">
                {t("landing.showcase_title")}
              </h2>
              <p className="mt-5 text-base leading-7 text-apple-gray-400">{t("landing.showcase_desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.65 }}
              className="relative mt-14 overflow-hidden rounded-2xl border border-black/5 bg-apple-light shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)]"
            >
              <img src="/Dashboard Analytics.png" alt={t("landing.dashboardPreview")} className="block h-auto w-full" />
            </motion.div>
            <p className="mt-5 text-center text-sm font-medium text-apple-gray-400">{t("landing.showcase_dashboard_label")}</p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-apple-light py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-4xl font-semibold leading-tight tracking-tight text-apple-gray-700 sm:text-5xl">
                {t("landing.everythingYouNeed")}
              </h2>
              <p className="mt-5 text-base leading-7 text-apple-gray-400">{t("landing.everythingYouNeedDesc")}</p>
            </div>

            <div className="space-y-20 sm:space-y-28">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const reversed = index % 2 === 1;
                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${reversed ? "lg:[&>div:first-child]:order-2" : ""}`}
                  >
                    <div className="max-w-xl" dir={direction}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-appleBlue-50 text-appleBlue-500">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-6 text-3xl font-semibold tracking-tight text-apple-gray-700 sm:text-4xl">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-lg font-medium text-appleBlue-500">{feature.outcome}</p>
                      <p className="mt-4 text-base leading-7 text-apple-gray-400">{feature.description}</p>
                      <ul className="mt-6 space-y-2.5">
                        {feature.checks.map((check) => (
                          <li key={check} className="flex items-center gap-3 text-sm font-normal text-apple-gray-500">
                            <FiCheck className="h-4 w-4 shrink-0 text-appleBlue-500" />
                            <span>{check}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]">
                      <img src={feature.image} alt={feature.alt} className="block h-auto w-full" />
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="bg-black py-24 text-white sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-appleBlue-400">{t("landing.workflow_label")}</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {t("landing.workflow_title")}
              </h2>
              <p className="mt-5 text-base leading-7 text-white/50">{t("landing.workflow_desc")}</p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
                >
                  <span className="text-sm font-semibold text-appleBlue-400">0{step}</span>
                  <h3 className="mt-5 text-lg font-semibold">{t(`landing.how_step${step}_title`)}</h3>
                  <p className="mt-2.5 text-sm leading-6 text-white/45">{t(`landing.how_step${step}_desc`)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-sm font-semibold text-appleBlue-500">{t("landing.pricing_label")}</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-apple-gray-700 sm:text-5xl">
                {t("landing.simpleTransparentPricing")}
              </h2>
              <p className="mt-5 text-base leading-7 text-apple-gray-400">{t("landing.pricingDesc")}</p>
              <p className="mt-2 text-sm font-medium text-appleBlue-500">{t("landing.pricing_note")}</p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
              <PlanCard
                title={t("landing.starter")}
                price={starterPlan?.price ?? 0}
                currency={pricingCurrencyLabel}
                monthLabel={t("landing.usdPerMonth")}
                perExtraLocationLabel={t("landing.perExtraLocation")}
                extraLocation={`${STARTER_EXTRA_LOCATION_PRICE} ${pricingCurrencyLabel}${t("landing.usdPerMonth")}`}
                description={t("landing.plan_includes")}
                features={[
                  t("landing.allCoreFeatures"),
                  t("landing.singleLocation"),
                  `${t("landing.basicAnalytics")} · ${t("landing.emailSupport")}`,
                ]}
                cta={t("landing.get_started")}
              />
              <PlanCard
                featured
                title={t("landing.pro")}
                price={proPlan?.price ?? 0}
                currency={pricingCurrencyLabel}
                monthLabel={t("landing.usdPerMonth")}
                perExtraLocationLabel={t("landing.perExtraLocation")}
                extraLocation={`${PRO_EXTRA_LOCATION_PRICE} ${pricingCurrencyLabel}${t("landing.usdPerMonth")}`}
                description={t("landing.plan_includes")}
                featuredLabel={t("landing.most_popular")}
                features={[
                  t("landing.everythingInStarter"),
                  t("landing.unlimitedMembers"),
                  `${t("landing.advancedAnalytics")} · ${t("landing.prioritySupport")}`,
                  t("landing.whatsappBot"),
                ]}
                cta={t("landing.get_started")}
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-apple-light px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-appleBlue-500">{t("landing.final_cta_eyebrow")}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-apple-gray-700 sm:text-5xl">
              {t("landing.final_cta_title")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-apple-gray-400">{t("landing.final_cta_desc")}</p>
            <Link
              to="/signup"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-appleBlue-500 px-7 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-appleBlue-600"
            >
              {t("landing.final_cta_button")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-sm">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-6 w-auto" />
                <span className="border-s border-black/10 ps-2.5 text-[11px] font-normal text-apple-gray-400">
                  إدارة
                </span>
              </Link>
              <p className="mt-3 text-sm leading-6 text-apple-gray-400">{t("landing.footer_tagline")}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-normal text-apple-gray-400">
              <button onClick={() => scrollTo("#features")} className="transition-colors hover:text-apple-gray-700">
                {t("navbar.features")}
              </button>
              <button onClick={() => scrollTo("#pricing")} className="transition-colors hover:text-apple-gray-700">
                {t("navbar.pricing")}
              </button>
              <Link to="/login" className="transition-colors hover:text-apple-gray-700">
                {t("auth.signIn")}
              </Link>
              <Link to="/signup" className="transition-colors hover:text-apple-gray-700">
                {t("landing.get_started")}
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-black/5 pt-6 text-xs font-normal text-apple-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("landing.madeForGulf")}</span>
            <span>{t("landing.trust_line")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

type PlanCardProps = {
  title: string;
  price: number;
  currency: string;
  monthLabel: string;
  perExtraLocationLabel: string;
  extraLocation: string;
  description: string;
  featuredLabel?: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const PlanCard: React.FC<PlanCardProps> = ({
  title,
  price,
  currency,
  monthLabel,
  perExtraLocationLabel,
  extraLocation,
  description,
  featuredLabel,
  features,
  cta,
  featured = false,
}) => (
  <motion.article
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    className={`relative rounded-2xl bg-white p-8 sm:p-10 ${featured ? "ring-2 ring-appleBlue-500" : "ring-1 ring-black/5"}`}
  >
    {featured && (
      <span className="absolute end-8 top-8 rounded-full bg-appleBlue-50 px-3 py-1 text-xs font-semibold text-appleBlue-500">
        {featuredLabel}
      </span>
    )}
    <p className="text-sm font-medium text-apple-gray-400">{title}</p>
    <div className="mt-4 flex items-end gap-2">
      <span className="text-5xl font-semibold tracking-tight text-apple-gray-700">{price}</span>
      <span className="pb-1.5 text-sm font-normal text-apple-gray-400">
        {currency} {monthLabel}
      </span>
    </div>
    <p className="mt-2 text-xs font-medium text-appleBlue-500">
      +{extraLocation} {perExtraLocationLabel}
    </p>
    <div className="my-7 border-t border-black/5" />
    <p className="text-sm font-medium text-apple-gray-500">{description}</p>
    <ul className="mt-5 space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm text-apple-gray-500">
          <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-appleBlue-500" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Link
      to="/signup"
      className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-colors duration-200 ${
        featured ? "bg-appleBlue-500 text-white hover:bg-appleBlue-600" : "bg-apple-light text-apple-gray-700 hover:bg-apple-gray-100"
      }`}
    >
      {cta}
    </Link>
  </motion.article>
);

export default PremiumLanding;
