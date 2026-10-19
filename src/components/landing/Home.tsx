import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiActivity,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCheckSquare,
  FiDollarSign,
  FiMapPin,
  FiMenu,
  FiShoppingCart,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import { BrandMark } from "../BrandMark";
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

const NEWMUX_URL = "https://www.newmux.com";

// Screenshots of the real app (public/screens), captured at 2x from the
// demo data set. Width/height let the browser reserve space before load.
const SCREEN_W = 2880;
const SCREEN_H = 1800;

type TourId = "dashboard" | "members" | "classes" | "attendance" | "billing" | "pos";

const TOUR: { id: TourId; image: string }[] = [
  { id: "dashboard", image: "/screens/dashboard.webp" },
  { id: "members", image: "/screens/members.webp" },
  { id: "classes", image: "/screens/classes.webp" },
  { id: "attendance", image: "/screens/attendance.webp" },
  { id: "billing", image: "/screens/billing.webp" },
  { id: "pos", image: "/screens/pos.webp" },
];


/**
 * A macOS window around a product screenshot: title bar with the three
 * window controls, hairline edge and the soft window shadow.
 */
const MacWindow: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="overflow-hidden rounded-xl bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.14),0_28px_70px_-16px_rgba(0,0,0,0.3)]">
    <div className="relative flex h-7 items-center gap-2 border-b border-black/5 bg-[#F4F4F4] px-3" dir="ltr">
      <span className="h-3 w-3 rounded-full bg-[#FF5F57] ring-1 ring-inset ring-black/10" />
      <span className="h-3 w-3 rounded-full bg-[#FEBC2E] ring-1 ring-inset ring-black/10" />
      <span className="h-3 w-3 rounded-full bg-[#28C840] ring-1 ring-inset ring-black/10" />
      <span className="pointer-events-none absolute inset-x-0 text-center text-xs font-medium text-gray-500">
        {title}
      </span>
    </div>
    {children}
  </div>
);

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const direction = isRTL ? "rtl" : "ltr";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tour, setTour] = useState<TourId>("dashboard");

  const starterPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "starter");
  const proPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "pro");
  const currencyCode = (starterPlan?.currency || proPlan?.currency || PLATFORM_CURRENCY).toUpperCase();
  const currencyLabel = isRTL ? CURRENCY_SHORT_LABELS_AR[currencyCode] || currencyCode : currencyCode;

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: "#features", label: t("home.nav_features") },
    { id: "#region", label: t("home.nav_region") },
    { id: "#pricing", label: t("home.nav_pricing") },
    { id: "#newmux", label: t("home.nav_about") },
  ];

  const features = [
    { icon: FiUsers, title: t("home.f_members"), desc: t("home.f_members_desc") },
    { icon: FiCalendar, title: t("home.f_classes"), desc: t("home.f_classes_desc") },
    { icon: FiUser, title: t("home.f_trainers"), desc: t("home.f_trainers_desc") },
    { icon: FiActivity, title: t("home.f_attendance"), desc: t("home.f_attendance_desc") },
    { icon: FiDollarSign, title: t("home.f_billing"), desc: t("home.f_billing_desc") },
    { icon: FiShoppingCart, title: t("home.f_pos"), desc: t("home.f_pos_desc") },
    { icon: FiMapPin, title: t("home.f_branches"), desc: t("home.f_branches_desc") },
    { icon: FiBarChart2, title: t("home.f_analytics"), desc: t("home.f_analytics_desc") },
    { icon: FiCheckSquare, title: t("home.f_tasks"), desc: t("home.f_tasks_desc") },
  ];

  const plans = [
    {
      id: "starter",
      name: t("landing.starter"),
      desc: t("home.plan_starter_desc"),
      price: starterPlan?.price ?? 0,
      extra: STARTER_EXTRA_LOCATION_PRICE,
      features: [t("landing.allCoreFeatures"), t("landing.singleLocation"), t("landing.basicAnalytics"), t("landing.emailSupport")],
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
        t("landing.whatsappBot"),
      ],
      featured: true,
    },
  ];

  const ctaLink = (placement: string, className: string, label: string) => (
    <Link
      to="/signup"
      onClick={() => trackMarketingEvent("trial_cta_click", { placement })}
      className={className}
    >
      {label}
    </Link>
  );

  const primaryButton =
    "inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-blue-700";

  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-white text-gray-900 antialiased" dir={direction}>
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" aria-label={t("landing.home_link")} className="text-gray-900">
            <BrandMark poweredBy className="text-[17px]" poweredByClassName="text-gray-500" />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-[13px] text-gray-600 transition-colors hover:text-gray-900"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <LanguageSwitcher forceLight />
            <Link to="/login" className="text-[13px] text-gray-600 transition-colors hover:text-gray-900">
              {t("home.sign_in")}
            </Link>
            {ctaLink(
              "nav",
              "inline-flex items-center rounded-full bg-blue-600 px-3.5 py-1 text-[13px] font-medium text-white transition-colors hover:bg-blue-700",
              t("home.get_started"),
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-md p-1.5 text-gray-700 hover:bg-black/5 md:hidden"
            aria-label={mobileMenuOpen ? t("landing.close_menu") : t("landing.open_menu")}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-black/5 bg-white px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-start text-[15px] text-gray-700"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex items-center justify-between border-t border-black/5 pt-4">
                <LanguageSwitcher forceLight />
                <Link to="/login" className="text-[15px] text-gray-700">
                  {t("home.sign_in")}
                </Link>
              </div>
              {ctaLink("mobile-nav", primaryButton, t("home.get_started"))}
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* Hero + product tour */}
        <section className="pt-32 sm:pt-40">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="mx-auto max-w-3xl text-center"
            >
              <h1 className="text-[44px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                {t("home.hero_title")}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-500 sm:text-xl">
                {t("home.hero_subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
                {ctaLink("hero", primaryButton, t("home.hero_primary"))}
                <button
                  onClick={() => scrollTo("#tour")}
                  className="inline-flex items-center gap-1 text-[15px] font-medium text-blue-600 hover:underline"
                >
                  {t("home.hero_secondary")}
                  <FiArrowUpRight className={`h-4 w-4 ${isRTL ? "-scale-x-100" : ""}`} />
                </button>
              </div>
              <p className="mt-4 text-[13px] text-gray-500">{t("home.hero_note")}</p>
            </motion.div>

            <motion.div
              id="tour"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="mt-16 scroll-mt-24 sm:mt-20"
            >
              <div className="mb-5 flex justify-center">
                <div
                  role="tablist"
                  aria-label={t("home.tour_label")}
                  className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-black/5 p-0.5"
                >
                  {TOUR.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tour === item.id}
                      onClick={() => setTour(item.id)}
                      className={`whitespace-nowrap rounded-md px-3 py-1 text-[13px] transition-colors ${
                        tour === item.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {t(`home.tour_${item.id}`)}
                    </button>
                  ))}
                </div>
              </div>

              <MacWindow title={t("home.window_title")}>
                <div className="relative bg-white" style={{ aspectRatio: `${SCREEN_W} / ${SCREEN_H}` }}>
                  {TOUR.map((item, index) => (
                    <img
                      key={item.id}
                      src={isRTL ? item.image.replace(".webp", "-ar.webp") : item.image}
                      alt={t(`home.tour_caption_${item.id}`)}
                      width={SCREEN_W}
                      height={SCREEN_H}
                      loading={index === 0 ? "eager" : "lazy"}
                      className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 ${
                        tour === item.id ? "opacity-100" : "opacity-0"
                      }`}
                      aria-hidden={tour !== item.id}
                    />
                  ))}
                </div>
              </MacWindow>

              <AnimatePresence mode="wait">
                <motion.p
                  key={tour}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mx-auto mt-5 max-w-xl text-center text-[15px] text-gray-500"
                >
                  {t(`home.tour_caption_${tour}`)}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{t("home.features_title")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-500">{t("home.features_subtitle")}</p>
            </div>

            <dl className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="border-t border-black/[0.08] py-6">
                    <dt className="flex items-center gap-2 text-[17px] font-semibold">
                      <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      {feature.title}
                    </dt>
                    <dd className="mt-1.5 text-[15px] leading-relaxed text-gray-500">{feature.desc}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        {/* Arabic & English */}
        <section id="region" className="scroll-mt-16 bg-[#F5F5F7] py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{t("home.region_title")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-500">{t("home.region_subtitle")}</p>
              <ul className="mt-8 space-y-3">
                {[t("home.region_point_rtl"), t("home.region_point_currency"), t("home.region_point_vat")].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[15px] text-gray-700">
                    <FiCheck className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <LanguageSwitcher forceLight />
              </div>
            </div>
            <div>
              <MacWindow title={t("home.window_title")}>
                <img
                  src="/screens/dashboard-ar.webp"
                  alt={t("home.region_point_rtl")}
                  width={SCREEN_W}
                  height={SCREEN_H}
                  loading="lazy"
                  className="block h-auto w-full"
                />
              </MacWindow>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-16 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{t("home.pricing_title")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-500">{t("home.pricing_subtitle")}</p>
            </div>

            <div
              className="mt-14 grid overflow-hidden rounded-2xl bg-[#F5F5F7] md:grid-cols-2 md:divide-x md:divide-black/[0.08] rtl:md:divide-x-reverse"
            >
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`flex flex-col p-8 sm:p-10 ${index > 0 ? "border-t border-black/[0.08] md:border-t-0" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    {plan.featured && (
                      <span className="text-[13px] font-medium text-blue-600">{t("landing.most_popular")}</span>
                    )}
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
                  {ctaLink(
                    `${plan.id}-pricing`,
                    plan.featured
                      ? `${primaryButton} mt-8 w-full`
                      : "mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-gray-900 shadow-[0_0_0_0.5px_rgba(0,0,0,0.15)] transition-colors hover:bg-gray-50",
                    t("home.get_started"),
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About NewMux */}
        <section id="newmux" className="scroll-mt-16 border-t border-black/[0.06] py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-[15px] font-medium text-gray-500">{t("home.about_label")}</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{t("home.about_title")}</h2>
              <p className="mt-5 text-lg leading-relaxed text-gray-500">{t("home.about_body")}</p>
              <a
                href={NEWMUX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-1 text-[15px] font-medium text-blue-600 hover:underline"
              >
                {t("home.about_link")}
                <FiArrowUpRight className={`h-4 w-4 ${isRTL ? "-scale-x-100" : ""}`} aria-hidden="true" />
              </a>
            </div>
            <ul className="self-end">
              {[t("home.about_point_software"), t("home.about_point_ai"), t("home.about_point_cloud")].map((point) => (
                <li
                  key={point}
                  className="border-t border-black/[0.08] py-5 text-2xl font-semibold tracking-[-0.01em] last:border-b"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="bg-[#F5F5F7] py-24 sm:py-32">
          <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
            <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{t("home.cta_title")}</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-500">{t("home.cta_subtitle")}</p>
            <div className="mt-8">{ctaLink("final-cta", primaryButton, t("home.hero_primary"))}</div>
            <p className="mt-4 text-[13px] text-gray-500">{t("home.hero_note")}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 text-[13px] text-gray-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <BrandMark poweredBy className="text-[17px] text-gray-900" poweredByClassName="text-gray-500" />
            <span>{t("home.footer_rights", { year: new Date().getFullYear() })}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button onClick={() => scrollTo("#features")} className="hover:text-gray-900">
              {t("home.nav_features")}
            </button>
            <button onClick={() => scrollTo("#pricing")} className="hover:text-gray-900">
              {t("home.nav_pricing")}
            </button>
            <Link to="/terms" className="hover:text-gray-900">
              {t("home.terms")}
            </Link>
            <Link to="/privacy" className="hover:text-gray-900">
              {t("home.privacy")}
            </Link>
            <Link to="/login" className="hover:text-gray-900">
              {t("home.sign_in")}
            </Link>
            <a href={NEWMUX_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
              {t("home.footer_product")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
