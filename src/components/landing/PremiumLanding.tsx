import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
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

const PremiumLanding: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const direction = isRTL ? "rtl" : "ltr";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const starterPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "starter");
  const proPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "pro");
  const currencyLabel = (starterPlan?.currency || proPlan?.currency || PLATFORM_CURRENCY).toUpperCase();
  const pricingCurrencyLabel = isRTL ? t("landing.currency_short") : currencyLabel;


  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  const capabilities = [
    {
      icon: FiGrid,
      number: "01",
      title: t("landing.capability_operations"),
      description: t("landing.capability_operations_desc"),
      accent: "#155fd9",
    },
    {
      icon: FiTrendingUp,
      number: "02",
      title: t("landing.capability_growth"),
      description: t("landing.capability_growth_desc"),
      accent: "#489bfa",
    },
    {
      icon: FiGlobe,
      number: "03",
      title: t("landing.capability_local"),
      description: t("landing.capability_local_desc"),
      accent: "#7bbdfe",
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

  const navLinkClass = "text-[#0b1a44]/70 hover:text-[#0b1a44]";

  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-white text-[#0b1a44]" dir={direction}>
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="fixed inset-x-0 top-0 z-50 border-b border-[#0b1a44]/10 bg-white/90 text-[#0b1a44] shadow-[0_10px_40px_rgba(13,31,133,0.08)] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="group flex items-center gap-3" aria-label={t("landing.home_link")}>
            <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-7 w-auto transition-transform duration-200 group-hover:scale-[1.02] sm:h-8" />
            <span className="hidden border-s border-[#0b1a44]/20 ps-3 text-xs font-medium text-[#0b1a44]/50 sm:inline">إدارة</span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <button onClick={() => scrollTo("#features")} className={`text-sm font-semibold transition-colors ${navLinkClass}`}>
              {t("navbar.features")}
            </button>
            <button onClick={() => scrollTo("#workflow")} className={`text-sm font-semibold transition-colors ${navLinkClass}`}>
              {t("navbar.how")}
            </button>
            <button onClick={() => scrollTo("#pricing")} className={`text-sm font-semibold transition-colors ${navLinkClass}`}>
              {t("navbar.pricing")}
            </button>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0d1f85] via-[#155fd9] to-[#489bfa] px-5 py-3 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-[#155fd9] hover:to-[#7bbdfe] active:scale-[0.97]"
            >
              {t("landing.get_started")}
              <FiArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-xl p-2 text-[#0b1a44] transition-colors hover:bg-[#0b1a44]/5 md:hidden"
            aria-label={mobileMenuOpen ? t("landing.close_menu") : t("landing.open_menu")}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-[#0b1a44]/10 bg-white px-5 py-5 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollTo("#features")} className="text-start text-sm font-semibold text-[#0b1a44]/70 hover:text-[#0b1a44]">
                {t("navbar.features")}
              </button>
              <button onClick={() => scrollTo("#workflow")} className="text-start text-sm font-semibold text-[#0b1a44]/70 hover:text-[#0b1a44]">
                {t("navbar.how")}
              </button>
              <button onClick={() => scrollTo("#pricing")} className="text-start text-sm font-semibold text-[#0b1a44]/70 hover:text-[#0b1a44]">
                {t("navbar.pricing")}
              </button>
              <div className="border-t border-[#0b1a44]/10 pt-4">
                <LanguageSwitcher />
              </div>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0d1f85] via-[#155fd9] to-[#489bfa] px-5 py-3 text-sm font-black text-white">
                {t("landing.get_started")}
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      <main>
        <section className="relative overflow-hidden bg-white pt-32 text-[#0b1a44] sm:pt-40">
          <div className="pointer-events-none absolute -start-40 top-32 h-[32rem] w-[32rem] rounded-full bg-[#489bfa]/10 blur-3xl" />
          <div className="pointer-events-none absolute -end-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#7bbdfe]/15 blur-3xl" />
          <div className="pointer-events-none absolute end-[14%] top-[20%] hidden h-2 w-2 rounded-full bg-[#489bfa] shadow-[0_0_24px_8px_rgba(72,155,250,0.25)] lg:block" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 lg:px-10 lg:pb-28">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-2xl text-[#0b1a44]"
            >
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#155fd9]/25 bg-[#155fd9]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#155fd9]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#155fd9] shadow-[0_0_0_4px_rgba(72,155,250,0.12)]" />
                {t("landing.eyebrow")}
              </div>

              <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[5.7rem]">
                {t("landing.hero_title")} <span className="text-[#489bfa]">{t("landing.hero_title_highlight")}</span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-[#0b1a44]/70 sm:text-xl">
                {t("landing.hero_description")}
              </p>
              <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-[#0b1a44]/50">
                {t("landing.hero_supporting")}
              </p>

              <div className={`mt-9 flex flex-col gap-3 sm:flex-row ${isRTL ? "sm:flex-row-reverse sm:justify-end" : ""}`}>
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#0d1f85] via-[#155fd9] to-[#489bfa] px-6 py-4 text-sm font-black text-white shadow-[0_16px_40px_rgba(72,155,250,0.22)] transition-all duration-200 hover:-translate-y-1 hover:from-[#155fd9] hover:to-[#7bbdfe] active:scale-[0.97]"
                >
                  {t("landing.startFreeTrial")}
                  <FiArrowRight className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                </Link>
                <button
                  onClick={() => scrollTo("#features")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0b1a44]/15 px-6 py-4 text-sm font-bold text-[#0b1a44] transition-all duration-200 hover:-translate-y-1 hover:border-[#155fd9]/40 hover:bg-[#eef5ff] active:scale-[0.97]"
                >
                  {t("landing.seeHowItWorks")}
                  <FiArrowDownIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-[#0b1a44]/50">
                <span className="inline-flex items-center gap-2"><FiCheckCircle className="h-4 w-4 text-[#155fd9]" />{t("landing.hero_free_trial")}</span>
                <span className="inline-flex items-center gap-2"><FiShield className="h-4 w-4 text-[#489bfa]" />{t("landing.hero_no_card")}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 28, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
              className="relative lg:pt-6"
            >
              <div className="absolute -inset-4 rounded-[2rem] border border-[#489bfa]/15 bg-[#489bfa]/5 blur-sm" />
              <div className="relative overflow-hidden rounded-[1.7rem] border border-white/15 bg-[#f8faf7] p-2 shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:p-3">
                <div className="flex items-center justify-between rounded-t-2xl bg-[#eef3f0] px-4 py-3 text-[#0b1a44] sm:px-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b1a44] text-xs font-black text-[#155fd9]">M</span>
                    <span className="text-xs font-black tracking-wide">{t("landing.hero_proof_label")}</span>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f2ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0d1f85]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#155fd9]" />
                    {t("landing.hero_live")}
                  </span>
                </div>
                <div className="relative overflow-hidden rounded-b-xl bg-white">
                  <img src="/Dashboard.png" alt={t("landing.dashboardPreview")} className="block h-auto w-full" />
                  <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2 sm:inset-x-5 sm:bottom-5 sm:gap-3">
                    <div className="rounded-xl border border-white/70 bg-[#071450]/90 p-2.5 text-white shadow-lg backdrop-blur sm:p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{t("landing.hero_stat_members")}</p>
                      <p className="mt-1 text-sm font-black sm:text-lg">1,247</p>
                    </div>
                    <div className="rounded-xl border border-white/70 bg-[#071450]/90 p-2.5 text-white shadow-lg backdrop-blur sm:p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{t("landing.hero_stat_attendance")}</p>
                      <p className="mt-1 text-sm font-black text-[#155fd9] sm:text-lg">78%</p>
                    </div>
                    <div className="rounded-xl border border-white/70 bg-[#071450]/90 p-2.5 text-white shadow-lg backdrop-blur sm:p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{t("landing.hero_stat_revenue")}</p>
                      <p className="mt-1 text-sm font-black text-[#489bfa] sm:text-lg">{t("landing.hero_stat_revenue_value")}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-5 flex items-center justify-between gap-4 text-xs text-[#0b1a44]/50">
                <span>{t("landing.hero_proof_title")}</span>
                <span className="text-end">{t("landing.hero_proof_caption")}</span>
              </div>
            </motion.div>
          </div>

          <div className="relative border-t border-[#0b1a44]/10 bg-[#f4f7ff]">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 text-xs font-semibold text-[#0b1a44]/55 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
              <span className="text-sm text-[#0b1a44]/70">{t("landing.hero_made_for_menat")}</span>
              <div className="flex flex-wrap items-center gap-5 uppercase tracking-[0.18em]">
                <span className="inline-flex items-center gap-2"><FiGlobe className="h-4 w-4 text-[#489bfa]" />{t("landing.trust_bilingual")}</span>
                <span className="inline-flex items-center gap-2"><FiShield className="h-4 w-4 text-[#155fd9]" />{t("landing.trust_vat")}</span>
                <span className="inline-flex items-center gap-2"><FiZap className="h-4 w-4 text-[#7bbdfe]" />{t("landing.trust_region")}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f8fafc] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55 }}
                className="max-w-md"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#155fd9]">{t("landing.essentials_label")}</p>
                <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1a44] sm:text-5xl">{t("landing.essentials_title")}</h2>
                <p className="mt-6 text-base leading-7 text-[#0b1a44]/60">{t("landing.essentials_desc")}</p>
              </motion.div>

              <div className="grid gap-4 md:grid-cols-3">
                {capabilities.map((capability, index) => {
                  const Icon = capability.icon;
                  return (
                    <motion.article
                      key={capability.number}
                      initial={{ opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      className="group rounded-3xl border border-[#0b1a44]/10 bg-white p-6 shadow-[0_12px_40px_rgba(7,30,37,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(7,30,37,0.1)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${capability.accent}33`, color: capability.accent === "#7bbdfe" ? "#155fd9" : "#155fd9" }}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-black tracking-[0.18em] text-[#0b1a44]/25">{capability.number}</span>
                      </div>
                      <h3 className="mt-8 text-xl font-black tracking-[-0.03em]">{capability.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#0b1a44]/55">{capability.description}</p>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#eef5ff] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#155fd9]">{t("landing.showcase_label")}</p>
                <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1a44] sm:text-5xl">{t("landing.showcase_title")}</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#0b1a44]/55">{t("landing.showcase_desc")}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.65 }}
              className="relative overflow-hidden rounded-[2rem] bg-[#0b1a44] p-3 shadow-[0_24px_80px_rgba(7,30,37,0.2)] sm:p-5"
            >
              <div className="flex items-center justify-between px-2 pb-4 text-white/55 sm:px-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold"><FiActivity className="h-4 w-4 text-[#155fd9]" />{t("landing.showcase_dashboard_label")}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">MTDRB / إدارة</span>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-white">
                <img src="/Dashboard Analytics.png" alt={t("landing.dashboardPreview")} className="block h-auto w-full" />
                <div className="absolute bottom-4 end-4 hidden max-w-[220px] rounded-2xl border border-white/60 bg-[#f8fafc]/95 p-4 text-[#0b1a44] shadow-2xl backdrop-blur sm:block">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0b1a44]/45">{t("landing.showcase_billing_label")}</span>
                    <FiBarChart2 className="h-4 w-4 text-[#155fd9]" />
                  </div>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em]">+12.4%</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#0b1a44]/10"><span className="block h-full w-[74%] rounded-full bg-[#155fd9]" /></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="bg-[#f8fafc] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-16 max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#155fd9]">{t("landing.feature_outcome")}</p>
              <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1a44] sm:text-5xl">{t("landing.everythingYouNeed")}</h2>
              <p className="mt-5 text-base leading-7 text-[#0b1a44]/60">{t("landing.everythingYouNeedDesc")}</p>
            </div>

            <div className="space-y-20 sm:space-y-28">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const reversed = index % 2 === 1;
                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${reversed ? "lg:[&>div:first-child]:order-2" : ""}`}
                  >
                    <div className="max-w-xl" dir={direction}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1a44] text-[#155fd9]"><Icon className="h-5 w-5" /></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0b1a44]/40">{t("landing.feature_outcome")}</span>
                      </div>
                      <h3 className="mt-7 text-3xl font-black tracking-[-0.05em] text-[#0b1a44] sm:text-4xl">{feature.title}</h3>
                      <p className="mt-3 text-xl font-bold tracking-[-0.03em] text-[#155fd9]">{feature.outcome}</p>
                      <p className="mt-5 text-base leading-7 text-[#0b1a44]/60">{feature.description}</p>
                      <ul className="mt-7 space-y-3">
                        {feature.checks.map((check) => (
                          <li key={check} className="flex items-center gap-3 text-sm font-semibold text-[#0b1a44]/75">
                            <FiCheck className="h-4 w-4 shrink-0 text-[#155fd9]" />
                            <span>{check}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="relative overflow-hidden rounded-[1.8rem] border border-[#0b1a44]/10 bg-white p-2 shadow-[0_18px_55px_rgba(7,30,37,0.1)] sm:p-3">
                      <div className="absolute start-6 top-6 z-10 rounded-full bg-[#155fd9] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0b1a44]">0{index + 1}</div>
                      <img src={feature.image} alt={feature.alt} className="block h-auto w-full rounded-2xl" />
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-[#0b1a44] py-24 text-white sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div className="max-w-md">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#155fd9]">{t("landing.workflow_label")}</p>
                <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl">{t("landing.workflow_title")}</h2>
                <p className="mt-6 text-base leading-7 text-white/55">{t("landing.workflow_desc")}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="relative rounded-3xl border border-white/10 bg-white/5 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black tracking-[-0.06em] text-[#155fd9]">0{step}</span>
                      {index === 0 && <FiUsers className="h-5 w-5 text-white/35" />}
                      {index === 1 && <FiGrid className="h-5 w-5 text-white/35" />}
                      {index === 2 && <FiActivity className="h-5 w-5 text-white/35" />}
                    </div>
                    <h3 className="mt-10 text-lg font-black">{t(`landing.how_step${step}_title`)}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/50">{t(`landing.how_step${step}_desc`)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#f8fafc] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#155fd9]">{t("landing.pricing_label")}</p>
              <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1a44] sm:text-5xl">{t("landing.simpleTransparentPricing")}</h2>
              <p className="mt-5 text-base leading-7 text-[#0b1a44]/60">{t("landing.pricingDesc")}</p>
              <p className="mt-3 text-sm font-semibold text-[#155fd9]">{t("landing.pricing_note")}</p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
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

        <section className="px-5 pb-24 sm:px-8 sm:pb-32 lg:px-10">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#0d1f85] px-6 py-14 text-white sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -end-16 -top-20 h-64 w-64 rounded-full border-[32px] border-[#155fd9]/10" />
            <div className="pointer-events-none absolute -bottom-24 start-[35%] h-64 w-64 rounded-full bg-[#489bfa]/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7bbdfe]">{t("landing.final_cta_eyebrow")}</p>
              <h2 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">{t("landing.final_cta_title")}</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/60">{t("landing.final_cta_desc")}</p>
              <Link to="/signup" className="mt-9 inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-black text-[#0d1f85] transition-all duration-200 hover:-translate-y-1 hover:bg-[#eef5ff] active:scale-[0.97]">
                {t("landing.final_cta_button")}
                <FiArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#0b1a44]/10 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-sm">
              <Link to="/" className="inline-flex items-center gap-3">
                <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-8 w-auto" />
                <span className="border-s border-[#0b1a44]/15 ps-3 text-xs font-medium text-[#0b1a44]/50">إدارة</span>
              </Link>
              <p className="mt-4 text-sm leading-6 text-[#0b1a44]/55">{t("landing.footer_tagline")}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#0b1a44]/55">
              <button onClick={() => scrollTo("#features")} className="transition-colors hover:text-[#0b1a44]">{t("navbar.features")}</button>
              <button onClick={() => scrollTo("#pricing")} className="transition-colors hover:text-[#0b1a44]">{t("navbar.pricing")}</button>
              <Link to="/login" className="transition-colors hover:text-[#0b1a44]">{t("auth.signIn")}</Link>
              <Link to="/signup" className="transition-colors hover:text-[#0b1a44]">{t("landing.get_started")}</Link>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#0b1a44]/10 pt-6 text-xs text-[#0b1a44]/40 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("landing.madeForGulf")}</span>
            <span>{t("landing.trust_line")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FiArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2.5v10M4.5 9l3.5 3.5L11.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

const PlanCard: React.FC<PlanCardProps> = ({ title, price, currency, monthLabel, perExtraLocationLabel, extraLocation, description, featuredLabel, features, cta, featured = false }) => (
  <motion.article
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    className={`relative rounded-[1.8rem] p-7 sm:p-9 ${featured ? "bg-[#0b1a44] text-white shadow-[0_24px_70px_rgba(7,30,37,0.2)]" : "border border-[#0b1a44]/10 bg-white text-[#0b1a44] shadow-[0_12px_40px_rgba(7,30,37,0.05)]"}`}
  >
    {featured && <span className="absolute end-7 top-7 rounded-full bg-[#155fd9] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0b1a44]">{featuredLabel}</span>}
    <p className={`text-sm font-bold ${featured ? "text-white/55" : "text-[#0b1a44]/55"}`}>{title}</p>
    <div className="mt-5 flex items-end gap-2">
      <span className="text-5xl font-black tracking-[-0.06em]">{price}</span>
      <span className={`pb-1 text-sm font-semibold ${featured ? "text-white/50" : "text-[#0b1a44]/50"}`}>{currency}{" "}{monthLabel}</span>
    </div>
    <p className={`mt-2 text-xs font-semibold ${featured ? "text-[#155fd9]" : "text-[#155fd9]"}`}>+{extraLocation} {perExtraLocationLabel}</p>
    <div className={`my-7 border-t ${featured ? "border-white/10" : "border-[#0b1a44]/10"}`} />
    <p className={`text-sm font-semibold ${featured ? "text-white/70" : "text-[#0b1a44]/65"}`}>{description}</p>
    <ul className="mt-5 space-y-3">
      {features.map((feature) => (
        <li key={feature} className={`flex items-start gap-3 text-sm ${featured ? "text-white/65" : "text-[#0b1a44]/65"}`}>
          <FiCheck className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-[#155fd9]" : "text-[#155fd9]"}`} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Link to="/signup" className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-black transition-all duration-200 active:scale-[0.97] ${featured ? "bg-[#155fd9] text-[#0b1a44] hover:bg-[#0d1f85]" : "border border-[#0b1a44]/15 bg-[#f8fafc] text-[#0b1a44] hover:border-[#0b1a44]/35 hover:bg-white"}`}>
      {cta}
    </Link>
  </motion.article>
);

export default PremiumLanding;
