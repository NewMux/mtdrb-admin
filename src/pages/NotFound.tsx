import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

export default function NotFound() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 p-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
        <div className="flex flex-col items-center text-center">
          <FiAlertCircle className="text-6xl text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t("notFound.title")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("notFound.description")}
          </p>
          <div className="space-y-4 w-full">
            <Link
              to={user ? "/dashboard" : "/"}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-colors"
            >
              {t("notFound.goTo", { destination: user ? t("notFound.dashboard") : t("notFound.home") })}
            </Link>
            {!user && (
              <Link
                to="/login"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-center transition-colors"
              >
                {t("notFound.login")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
