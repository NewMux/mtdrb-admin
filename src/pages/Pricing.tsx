import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { BrandMark } from "../components/BrandMark";
import PricingPlans from "../components/landing/PricingPlans";
import PublicFooter from "../components/landing/PublicFooter";
import { LEGAL_ENTITY_NAME } from "../config/runtimeConfig";

/**
 * Public pricing page (/pricing). It needs no sign-in, shows the real price,
 * currency and billing period of every plan, and says who sells the product,
 * how tax is handled and how to cancel or get a refund - the things Paddle's
 * website review checks before it approves a domain for live payments.
 */
const Pricing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const notes = [
    { title: t("pricing_page.billing_title"), body: t("pricing_page.billing_body") },
    { title: t("pricing_page.tax_title"), body: t("pricing_page.tax_body") },
    { title: t("pricing_page.cancel_title"), body: t("pricing_page.cancel_body") },
  ];

  return (
    <div className="landing-page min-h-screen bg-white text-gray-900 antialiased" dir={isRTL ? "rtl" : "ltr"}>
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" className="text-gray-900">
            <BrandMark poweredBy className="text-[17px]" poweredByClassName="text-gray-500" />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher forceLight />
            <Link to="/login" className="text-[13px] text-gray-600 transition-colors hover:text-gray-900">
              {t("home.sign_in")}
            </Link>
          </div>
        </div>
      </header>

      <main className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{t("pricing_page.title")}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-500">{t("pricing_page.subtitle")}</p>
          </div>

          <div className="mt-14">
            <PricingPlans placement="pricing-page" />
          </div>

          <dl className="mt-14 grid gap-8 md:grid-cols-3">
            {notes.map((note) => (
              <div key={note.title}>
                <dt className="text-[15px] font-semibold">{note.title}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-gray-600">{note.body}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-12 text-center text-[13px] leading-relaxed text-gray-500">
            {t("pricing_page.seller", { entity: LEGAL_ENTITY_NAME })}{" "}
            <Link to="/terms" className="font-medium text-blue-600 hover:underline">
              {t("home.terms")}
            </Link>
            {" · "}
            <Link to="/privacy" className="font-medium text-blue-600 hover:underline">
              {t("home.privacy")}
            </Link>
            {" · "}
            <Link to="/refund" className="font-medium text-blue-600 hover:underline">
              {t("home.refund")}
            </Link>
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Pricing;
