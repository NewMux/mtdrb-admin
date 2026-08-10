import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { Link } from "react-router-dom";

export default function NavBar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Smooth scroll handler
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    const element = document.querySelector(targetId);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      // Use requestAnimationFrame to ensure smooth scrolling doesn't block UI
      requestAnimationFrame(() => {
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      });
    }
  };

  return (
    <nav className="w-full bg-white/90 backdrop-blur border-b border-blue-100 shadow-sm sticky top-0 z-50" dir="ltr">
      <div className="max-w-4xl mx-auto flex items-center justify-between py-4 px-6">
        <div className="flex items-center">
          <Link to="/">
            <img 
              src="/mtdrb-logo.svg" 
              alt="MTDRB" 
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#features"
            onClick={(e) => handleSmoothScroll(e, "#features")}
            className="text-blue-900 font-medium hover:text-blue-500 transition-colors"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("navbar.features")}
          </a>
          <a
            href="#features"
            onClick={(e) => handleSmoothScroll(e, "#features")}
            className="text-blue-900 font-medium hover:text-blue-500 transition-colors"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("landing.solutions") || t("navbar.how")}
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleSmoothScroll(e, "#pricing")}
            className="text-blue-900 font-medium hover:text-blue-500 transition-colors"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("navbar.pricing")}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ease-in-out min-h-[44px] flex items-center"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("auth.signIn")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
