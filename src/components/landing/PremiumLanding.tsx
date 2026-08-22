import React, { useEffect, useState } from "react";
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const starterPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "starter");
  const proPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "pro");
  const currencyLabel = (starterPlan?.currency || proPlan?.currency || PLATFORM_CURRENCY).toUpperCase();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 28);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      accent: "#b8f36b",
    },
    {
      icon: FiTrendingUp,
      number: "02",
      title: t("landing.capability_growth"),
      description: t("landing.capability_growth_desc"),
      accent: "#61d8ff",
    },
    {
      icon: FiGlobe,
      number: "03",
      title: t("landing.capability_local"),
      description: t("landing.capability_local_desc"),
      accent: "#ffca76",
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

  const navLinkClass = isScrolled
    ? "text-[#0b1f28]/70 hover:text-[#0b1f28]"
    : "text-white/70 hover:text-white";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8f2] text-[#0b1f28]" dir={direction}>
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? "border-[#0b1f28]/10 bg-[#f7f8f2]/90 text-[#0b1f28] shadow-[0_10px_40px_rgba(7,30,37,0.08)] backdrop-blur-xl"
            : "border-white/10 bg-[#081e25]/80 text-white backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="group flex items-center gap-3" aria-label={t("landing.home_link")}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8f36b] text-sm font-black text-[#081e25] transition-transform duration-200 group-hover:rotate-6">
              M
            </span>
            <span className="text-lg font-black tracking-[-0.04em]">MTDRB</span>
            <span className={`hidden border-s ps-3 text-xs font-medium sm:inline ${isScrolled ? "border-[#0b1f28]/20 text-[#0b1f28]/50" : "border-white/20 text-white/50"}`}>
              إدارة
            </span>
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
              className="group inline-flex items-center gap-2 rounded-full bg-[#b8f36b] px-5 py-3 text-sm font-black text-[#081e25] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d0ff91] active:scale-[0.97]"
            >
              {t("landing.get_started")}
              <FiArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`rounded-xl p-2 transition-colors md:hidden ${isScrolled ? "text-[#0b1f28] hover:bg-[#0b1f28]/5" : "text-white hover:bg-white/10"}`}
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
            className="border-t border-white/10 bg-[#081e25] px-5 py-5 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollTo("#features")} className="text-start text-sm font-semibold text-white/75 hover:text-white">
                {t("navbar.features")}
              </button>
              <button onClick={() => scrollTo("#workflow")} className="text-start text-sm font-semibold text-white/75 hover:text-white">
                {t("navbar.how")}
              </button>
              <button onClick={() => scrollTo("#pricing")} className="text-start text-sm font-semibold text-white/75 hover:text-white">
                {t("navbar.pricing")}
              </button>
              <div className="border-t border-white/10 pt-4">
                <LanguageSwitcher />
              </div>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center rounded-full bg-[#b8f36b] px-5 py-3 text-sm font-black text-[#081e25]">
                {t("landing.get_started")}
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      <main>
        <section className="relative overflow-hidden bg-[#081e25] pt-32 text-white sm:pt-40">
          <div className="pointer-events-none absolute -start-40 top-32 h-[32rem] w-[32rem] rounded-full bg-[#154d56]/50 blur-3xl" />
          <div className="pointer-events-none absolute -end-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#123b40]/60 blur-3xl" />
          <div className="pointer-events-none absolute end-[14%] top-[20%] hidden h-2 w-2 rounded-full bg-[#b8f36b] shadow-[0_0_24px_8px_rgba(184,243,107,0.35)] lg:block" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 lg:px-10 lg:pb-28">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-2xl"
            >
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b8f36b]/25 bg-[#b8f36b]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#b8f36b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8f36b] shadow-[0_0_0_4px_rgba(184,243,107,0.12)]" />
                {t("landing.eyebrow")}
              </div>

              <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[5.7rem]">
                {t("landing.hero_title")} <span className="text-[#61d8ff]">{t("landing.hero_title_highlight")}</span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-white/65 sm:text-xl">
                {t("landing.hero_description")}
              </p>
              <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-white/40">
                {t("landing.hero_supporting")}
              </p>

              <div className={`mt-9 flex flex-col gap-3 sm:flex-row ${isRTL ? "sm:flex-row-reverse sm:justify-end" : ""}`}>
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#b8f36b] px-6 py-4 text-sm font-black text-[#081e25] shadow-[0_16px_40px_rgba(184,243,107,0.16)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#d0ff91] active:scale-[0.97]"
                >
                  {t("landing.startFreeTrial")}
                  <FiArrowRight className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                </Link>
                <button
                  onClick={() => scrollTo("#features")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-1 hover:border-white/45 hover:bg-white/5 active:scale-[0.97]"
                >
                  {t("landing.seeHowItWorks")}
                  <FiArrowDownIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-white/45">
                <span className="inline-flex items-center gap-2"><FiCheckCircle className="h-4 w-4 text-[#b8f36b]" />{t("landing.hero_free_trial")}</span>
                <span className="inline-flex items-center gap-2"><FiShield className="h-4 w-4 text-[#61d8ff]" />{t("landing.hero_no_card")}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 28, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
              className="relative lg:pt-6"
            >
              <div className="absolute -inset-4 rounded-[2rem] border border-[#61d8ff]/15 bg-[#61d8ff]/5 blur-sm" />
              <div className="relative overflow-hidden rounded-[1.7rem] border border-white/15 bg-[#f8faf7] p-2 shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:p-3">
                <div className="flex items-center justify-between rounded-t-2xl bg-[#eef3f0] px-4 py-3 text-[#0b1f28] sm:px-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b1f28] text-xs font-black text-[#b8f36b]">M</span>
                    <span className="text-xs font-black tracking-wide">{t("landing.hero_proof_label")}</span>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#dff7d0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#28712f]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#46b44b]" />
                    {t("landing.hero_live")}
                  </span>
                </div>
                <div className="relative overflow-hidden rounded-b-xl bg-white">
                  <img src="/Dashboard.png" alt={t("landing.dashboardPreview")} className="block h-auto w-full" />
                  <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2 sm:inset-x-5 sm:bottom-5 sm:gap-3">
                    <div className="rounded-xl border border-white/70 bg-[#081e25]/90 p-2.5 text-white shadow-lg backdrop-blur sm:p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{t("landing.hero_stat_members")}</p>
                      <p className="mt-1 text-sm font-black sm:text-lg">1,247</p>
                    </div>
                    <div className="rounded-xl border border-white/70 bg-[#081e25]/90 p-2.5 text-white shadow-lg backdrop-blur sm:p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{t("landing.hero_stat_attendance")}</p>
                      <p className="mt-1 text-sm font-black text-[#b8f36b] sm:text-lg">78%</p>
                    </div>
                    <div className="rounded-xl border border-white/70 bg-[#081e25]/90 p-2.5 text-white shadow-lg backdrop-blur sm:p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{t("landing.hero_stat_revenue")}</p>
                      <p className="mt-1 text-sm font-black text-[#61d8ff] sm:text-lg">$45k</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-5 flex items-center justify-between gap-4 text-xs text-white/45">
                <span>{t("landing.hero_proof_title")}</span>
                <span className="text-end">{t("landing.hero_proof_caption")}</span>
              </div>
            </motion.div>
          </div>

          <div className="relative border-t border-white/10 bg-[#0d2930]/75">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 text-xs font-semibold text-white/50 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
              <span className="text-sm text-white/70">{t("landing.hero_made_for_menat")}</span>
              <div className="flex flex-wrap items-center gap-5 uppercase tracking-[0.18em]">
                <span className="inline-flex items-center gap-2"><FiGlobe className="h-4 w-4 text-[#61d8ff]" />{t("landing.trust_bilingual")}</span>
                <span className="inline-flex items-center gap-2"><FiShield className="h-4 w-4 text-[#b8f36b]" />{t("landing.trust_vat")}</span>
                <span className="inline-flex items-center gap-2"><FiZap className="h-4 w-4 text-[#ffca76]" />{t("landing.trust_region")}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8f2] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55 }}
                className="max-w-md"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0e9cb8]">{t("landing.essentials_label")}</p>
                <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1f28] sm:text-5xl">{t("landing.essentials_title")}</h2>
                <p className="mt-6 text-base leading-7 text-[#0b1f28]/60">{t("landing.essentials_desc")}</p>
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
                      className="group rounded-3xl border border-[#0b1f28]/10 bg-white p-6 shadow-[0_12px_40px_rgba(7,30,37,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(7,30,37,0.1)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${capability.accent}33`, color: capability.accent === "#ffca76" ? "#9a5b00" : "#0b5965" }}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-black tracking-[0.18em] text-[#0b1f28]/25">{capability.number}</span>
                      </div>
                      <h3 className="mt-8 text-xl font-black tracking-[-0.03em]">{capability.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#0b1f28]/55">{capability.description}</p>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#e9eee7] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0e9cb8]">{t("landing.showcase_label")}</p>
                <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1f28] sm:text-5xl">{t("landing.showcase_title")}</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#0b1f28]/55">{t("landing.showcase_desc")}</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.65 }}
              className="relative overflow-hidden rounded-[2rem] bg-[#0b1f28] p-3 shadow-[0_24px_80px_rgba(7,30,37,0.2)] sm:p-5"
            >
              <div className="flex items-center justify-between px-2 pb-4 text-white/55 sm:px-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold"><FiActivity className="h-4 w-4 text-[#b8f36b]" />{t("landing.showcase_dashboard_label")}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">MTDRB / إدارة</span>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-white">
                <img src="/Dashboard Analytics.png" alt={t("landing.dashboardPreview")} className="block h-auto w-full" />
                <div className="absolute bottom-4 end-4 hidden max-w-[220px] rounded-2xl border border-white/60 bg-[#f7f8f2]/95 p-4 text-[#0b1f28] shadow-2xl backdrop-blur sm:block">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0b1f28]/45">{t("landing.showcase_billing_label")}</span>
                    <FiBarChart2 className="h-4 w-4 text-[#0e9cb8]" />
                  </div>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em]">+12.4%</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#0b1f28]/10"><span className="block h-full w-[74%] rounded-full bg-[#b8f36b]" /></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="bg-[#f7f8f2] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-16 max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0e9cb8]">{t("landing.feature_outcome")}</p>
              <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1f28] sm:text-5xl">{t("landing.everythingYouNeed")}</h2>
              <p className="mt-5 text-base leading-7 text-[#0b1f28]/60">{t("landing.everythingYouNeedDesc")}</p>
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
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1f28] text-[#b8f36b]"><Icon className="h-5 w-5" /></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0b1f28]/40">{t("landing.feature_outcome")}</span>
                      </div>
                      <h3 className="mt-7 text-3xl font-black tracking-[-0.05em] text-[#0b1f28] sm:text-4xl">{feature.title}</h3>
                      <p className="mt-3 text-xl font-bold tracking-[-0.03em] text-[#0e9cb8]">{feature.outcome}</p>
                      <p className="mt-5 text-base leading-7 text-[#0b1f28]/60">{feature.description}</p>
                      <ul className="mt-7 space-y-3">
                        {feature.checks.map((check) => (
                          <li key={check} className="flex items-center gap-3 text-sm font-semibold text-[#0b1f28]/75">
                            <FiCheck className="h-4 w-4 shrink-0 text-[#0e9cb8]" />
                            <span>{check}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="relative overflow-hidden rounded-[1.8rem] border border-[#0b1f28]/10 bg-white p-2 shadow-[0_18px_55px_rgba(7,30,37,0.1)] sm:p-3">
                      <div className="absolute start-6 top-6 z-10 rounded-full bg-[#b8f36b] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0b1f28]">0{index + 1}</div>
                      <img src={feature.image} alt={feature.alt} className="block h-auto w-full rounded-2xl" />
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-[#0b1f28] py-24 text-white sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div className="max-w-md">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b8f36b]">{t("landing.workflow_label")}</p>
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
                      <span className="text-3xl font-black tracking-[-0.06em] text-[#b8f36b]">0{step}</span>
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

        <section id="pricing" className="bg-[#f7f8f2] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0e9cb8]">{t("landing.pricing_label")}</p>
              <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0b1f28] sm:text-5xl">{t("landing.simpleTransparentPricing")}</h2>
              <p className="mt-5 text-base leading-7 text-[#0b1f28]/60">{t("landing.pricingDesc")}</p>
              <p className="mt-3 text-sm font-semibold text-[#0e9cb8]">{t("landing.pricing_note")}</p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
              <PlanCard
                title={t("landing.starter")}
                price={starterPlan?.price ?? 0}
                currency={currencyLabel}
                monthLabel={t("landing.usdPerMonth")}
                perExtraLocationLabel={t("landing.perExtraLocation")}
                extraLocation={`${STARTER_EXTRA_LOCATION_PRICE} ${currencyLabel}${t("landing.usdPerMonth")}`}
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
                currency={currencyLabel}
                monthLabel={t("landing.usdPerMonth")}
                perExtraLocationLabel={t("landing.perExtraLocation")}
                extraLocation={`${PRO_EXTRA_LOCATION_PRICE} ${currencyLabel}${t("landing.usdPerMonth")}`}
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
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#123e45] px-6 py-14 text-white sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -end-16 -top-20 h-64 w-64 rounded-full border-[32px] border-[#b8f36b]/10" />
            <div className="pointer-events-none absolute -bottom-24 start-[35%] h-64 w-64 rounded-full bg-[#61d8ff]/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b8f36b]">{t("landing.final_cta_eyebrow")}</p>
              <h2 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">{t("landing.final_cta_title")}</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/60">{t("landing.final_cta_desc")}</p>
              <Link to="/signup" className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#b8f36b] px-6 py-4 text-sm font-black text-[#081e25] transition-all duration-200 hover:-translate-y-1 hover:bg-[#d0ff91] active:scale-[0.97]">
                {t("landing.final_cta_button")}
                <FiArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#0b1f28]/10 bg-[#f7f8f2] py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-sm">
              <Link to="/" className="inline-flex items-center gap-3 text-lg font-black tracking-[-0.04em]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1f28] text-sm font-black text-[#b8f36b]">M</span>
                MTDRB
              </Link>
              <p className="mt-4 text-sm leading-6 text-[#0b1f28]/55">{t("landing.footer_tagline")}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#0b1f28]/55">
              <button onClick={() => scrollTo("#features")} className="transition-colors hover:text-[#0b1f28]">{t("navbar.features")}</button>
              <button onClick={() => scrollTo("#pricing")} className="transition-colors hover:text-[#0b1f28]">{t("navbar.pricing")}</button>
              <Link to="/login" className="transition-colors hover:text-[#0b1f28]">{t("auth.signIn")}</Link>
              <Link to="/signup" className="transition-colors hover:text-[#0b1f28]">{t("landing.get_started")}</Link>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#0b1f28]/10 pt-6 text-xs text-[#0b1f28]/40 sm:flex-row sm:items-center sm:justify-between">
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
    className={`relative rounded-[1.8rem] p-7 sm:p-9 ${featured ? "bg-[#0b1f28] text-white shadow-[0_24px_70px_rgba(7,30,37,0.2)]" : "border border-[#0b1f28]/10 bg-white text-[#0b1f28] shadow-[0_12px_40px_rgba(7,30,37,0.05)]"}`}
  >
    {featured && <span className="absolute end-7 top-7 rounded-full bg-[#b8f36b] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0b1f28]">{featuredLabel}</span>}
    <p className={`text-sm font-bold ${featured ? "text-white/55" : "text-[#0b1f28]/55"}`}>{title}</p>
    <div className="mt-5 flex items-end gap-2">
      <span className="text-5xl font-black tracking-[-0.06em]">{price}</span>
      <span className={`pb-1 text-sm font-semibold ${featured ? "text-white/50" : "text-[#0b1f28]/50"}`}>{currency}{" "}{monthLabel}</span>
    </div>
    <p className={`mt-2 text-xs font-semibold ${featured ? "text-[#b8f36b]" : "text-[#0e9cb8]"}`}>+{extraLocation} {perExtraLocationLabel}</p>
    <div className={`my-7 border-t ${featured ? "border-white/10" : "border-[#0b1f28]/10"}`} />
    <p className={`text-sm font-semibold ${featured ? "text-white/70" : "text-[#0b1f28]/65"}`}>{description}</p>
    <ul className="mt-5 space-y-3">
      {features.map((feature) => (
        <li key={feature} className={`flex items-start gap-3 text-sm ${featured ? "text-white/65" : "text-[#0b1f28]/65"}`}>
          <FiCheck className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-[#b8f36b]" : "text-[#0e9cb8]"}`} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Link to="/signup" className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-black transition-all duration-200 active:scale-[0.97] ${featured ? "bg-[#b8f36b] text-[#0b1f28] hover:bg-[#d0ff91]" : "border border-[#0b1f28]/15 bg-[#f7f8f2] text-[#0b1f28] hover:border-[#0b1f28]/35 hover:bg-white"}`}>
      {cta}
    </Link>
  </motion.article>
);

export default PremiumLanding;
