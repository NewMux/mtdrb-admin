import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandMark } from "../BrandMark";
import { LEGAL_EMAIL, LEGAL_ENTITY_NAME } from "../../config/runtimeConfig";

const NEWMUX_URL = "https://www.newmux.com";

/**
 * Footer for every public page (landing, pricing, legal). Paddle's website
 * review wants pricing, terms, privacy and refund policy reachable from every
 * page, plus the seller's identity and a way to contact them.
 */
const PublicFooter: React.FC<{ adaptive?: boolean }> = ({ adaptive = false }) => {
  const { t } = useTranslation();
  // Landing and pricing are light-only on purpose; only the legal pages have
  // dark variants, so the dark classes are opt-in.
  const dk = (classes: string) => (adaptive ? ` ${classes}` : "");
  const linkClass = `hover:text-gray-900${dk("dark:hover:text-white")}`;

  return (
    <footer className={`border-t border-black/[0.06] py-10${dk("dark:border-gray-800")}`}>
      <div className={`mx-auto flex max-w-6xl flex-col gap-6 px-5 text-[13px] text-gray-500${dk("dark:text-gray-400")} sm:px-8 md:flex-row md:items-center md:justify-between`}>
        <div className="flex flex-col gap-1">
          <BrandMark
            poweredBy
            className={`text-[17px] text-gray-900${dk("dark:text-white")}`}
            poweredByClassName={`text-gray-500${dk("dark:text-gray-400")}`}
          />
          <span>{t("home.footer_rights", { year: new Date().getFullYear() })}</span>
          <span>{t("home.footer_operated", { entity: LEGAL_ENTITY_NAME })}</span>
          <a href={`mailto:${LEGAL_EMAIL}`} className={linkClass}>
            {LEGAL_EMAIL}
          </a>
        </div>
        <nav aria-label={t("home.footer_nav")} className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/pricing" className={linkClass}>
            {t("home.nav_pricing")}
          </Link>
          <Link to="/terms" className={linkClass}>
            {t("home.terms")}
          </Link>
          <Link to="/privacy" className={linkClass}>
            {t("home.privacy")}
          </Link>
          <Link to="/refund" className={linkClass}>
            {t("home.refund")}
          </Link>
          <Link to="/login" className={linkClass}>
            {t("home.sign_in")}
          </Link>
          <a href={NEWMUX_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t("home.footer_product")}
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default PublicFooter;
